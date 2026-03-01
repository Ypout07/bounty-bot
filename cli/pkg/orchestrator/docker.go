package orchestrator

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
)

// RunAgent pulls the student's image, mounts the local private repo, injects secrets, and executes it.
func RunAgent(imageTag string, localRepoPath string, apiKey string) error {
	if apiKey == "" {
		return fmt.Errorf("API did not provide a GEMINI_API_KEY in the payload")
	}

	// Initialize the Docker client using environment variables (standard configuration)
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return fmt.Errorf("failed to initialize Docker client: %w", err)
	}
	defer cli.Close()

	// Create a base context
	ctx := context.Background()

	fmt.Printf("Pulling image %s from Docker Hub.\n", imageTag)
	reader, err := cli.ImagePull(ctx, imageTag, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image: %w", err)
	}

	io.Copy(os.Stdout, reader)
	reader.Close()

	// Resolve the absolute path of the local private repo for the volume mount
	absRepoPath, err := filepath.Abs(localRepoPath)
	if err != nil {
		return fmt.Errorf("failed to resolve absolute path for volume mount: %w", err)
	}

	// hostConfig (Volume mounts and resource limits)
	hostConfig := &container.HostConfig{
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeBind,
				Source: absRepoPath,
				Target: "/workspace",
			},
		},
		Resources: container.Resources{
			Memory: 1024 * 1024 * 1024, // 1GB limit
		},
	}

	fmt.Println("Creating container. This can take up to 1 minute.")

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: imageTag,
		Tty:   false,
		Env: []string{
			fmt.Sprintf("GEMINI_API_KEY=%s", apiKey),
		},
	}, hostConfig, nil, nil, "")

	if err != nil {
		return fmt.Errorf("failed to create container: %w", err)
	}

	fmt.Println("Starting AI Agent execution sequence. This times out after 10 minutes.")
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container: %w", err)
	}

	// agent has exactly 3 minutes
	timeoutCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()

	statusCh, errCh := cli.ContainerWait(timeoutCtx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return fmt.Errorf("container waiting error: %w", err)
		}
	case <-statusCh:
		fmt.Println("Agent finished execution.")
		_ = cli.ContainerRemove(ctx, resp.ID, container.RemoveOptions{Force: true})
		return nil

	case <-timeoutCtx.Done():
		// The agent hallucinated or hung. We kill it mercilessly.
		fmt.Println("Agent execution timed out. Force killing container.")
		_ = cli.ContainerKill(ctx, resp.ID, "SIGKILL")
		_ = cli.ContainerRemove(ctx, resp.ID, container.RemoveOptions{Force: true})
		return fmt.Errorf("agent execution exceeded 10 minute timeout")
	}

	return nil
}

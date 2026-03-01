package cmd

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/Ypout07/bounty-bot/cli/pkg/api"
	"github.com/Ypout07/bounty-bot/cli/pkg/evaluator"
	"github.com/Ypout07/bounty-bot/cli/pkg/orchestrator"
)

var batchRepoPath string

var batchCmd = &cobra.Command{
	Use:   "batch",
	Short: "Executes all pending submissions in the queue and terminates",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Starting batch eval.")

		processedCount := 0

		for {
			job, err := api.FetchNextJob()
			if err != nil {
				if errors.Is(err, api.ErrQueueEmpty) {
					fmt.Printf("\nQueue is empty. Batch processing complete.\n")
					break
				}
				panic(fmt.Sprintf("Fatal: API error: %v", err))
			}

			processedCount++
			fmt.Printf("\nProcessing job %d: %s (Tag: %s)\n", processedCount, job.SubmissionID, job.DockerImageTag)

			if strings.HasPrefix(job.DockerImageTag, "mock/") {
				fmt.Println("[*] SIMULATION MODE: Generating mock metrics...")
				time.Sleep(200 * time.Millisecond) // Visually pause so the terminal doesn't blur

				var passedTests bool
				var tokensUsed int
				var execTime float64

				if job.DockerImageTag == "mock/golden" {
					passedTests = true
					tokensUsed = 850
					execTime = 2.4
				} else {
					// Competitors have a 50% fail rate, burn 4k-10k tokens, and take 15-60 seconds
					passedTests = rand.Intn(2) == 0
					tokensUsed = 4000 + rand.Intn(6000)
					execTime = 15.0 + rand.Float64()*45.0
				}

				err = api.SubmitResults(job.SubmissionID, passedTests, execTime, tokensUsed)
				if err != nil {
					fmt.Printf("Failed to submit mock results for %s: %v\n", job.SubmissionID, err)
				} else {
					fmt.Println("Mock results successfully transmitted.")
				}

				// CRITICAL: Immediately halt this iteration and jump to the next job in the queue.
				// This guarantees we never call Docker or Git for a mock agent.
				continue
			}

			startTime := time.Now()
			agentFailed := false

			err = orchestrator.RunAgent(job.DockerImageTag, batchRepoPath, job.APIKey)
			if err != nil {
				fmt.Printf("Agent Execution Failed/Timed Out: %v\n", err)
				agentFailed = true
			}

			execTime := time.Since(startTime).Seconds()

			var passedTests bool
			var tokensUsed int

			if agentFailed {
				fmt.Println("Skipping tests due to agent failure.")
				passedTests = false
				tokensUsed = 0
			} else {
				passedTests = evaluator.ExecuteTests(batchRepoPath)
				metrics := evaluator.ParseMetrics(batchRepoPath)
				tokensUsed = metrics.TokensUsed
			}

			err = api.SubmitResults(job.SubmissionID, passedTests, execTime, tokensUsed)
			if err != nil {
				fmt.Printf("Failed to submit results for %s: %v\n", job.SubmissionID, err)
			} else {
				fmt.Println("Results successfully transmitted.")
			}

			err = evaluator.RevertWorkspace(batchRepoPath)
			if err != nil {
				panic(fmt.Sprintf("Failed to revert workspace state: %v", err))
			}
		}

		fmt.Printf("Batch eval terminated. %d submissions processed.\n", processedCount)
	},
}

func init() {
	rootCmd.AddCommand(batchCmd)
	batchCmd.Flags().StringVarP(&batchRepoPath, "repo-path", "r", "./execution-environment/company-private-repo", "Path to private repository")
}

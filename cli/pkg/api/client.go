package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// ErrQueueEmpty signals that the batch processor should terminate.
var ErrQueueEmpty = errors.New("no pending submissions in the queue")

const defaultBaseURL = "https://bountybot-six.vercel.app"
const demoJudgeKey = "DEMO_BYPASS_KEY_123"

func getBaseURL() string {
	if url := os.Getenv("API_BASE_URL"); url != "" {
		return url
	}
	return defaultBaseURL
}

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

// FetchNextJob is for the BATCH command. It asks for ANY pending job.
func FetchNextJob() (*PendingSubmissionResponse, error) {
	url := fmt.Sprintf("%s/api/submissions/pending", getBaseURL())
	return fetchJobFromURL(url)
}

// FetchPendingJob is for the RUN command. It asks for a SPECIFIC problem.
func FetchPendingJob(problemID string) (*PendingSubmissionResponse, error) {
	url := fmt.Sprintf("%s/api/submissions/pending?problem_id=%s", getBaseURL(), problemID)
	return fetchJobFromURL(url)
}

// Internal helper to keep the HTTP logic DRY (Don't Repeat Yourself)
func fetchJobFromURL(url string) (*PendingSubmissionResponse, error) {
	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("network error connecting to web platform: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrQueueEmpty
	} else if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code from web platform: %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var pendingJob PendingSubmissionResponse

	if err := json.Unmarshal(body, &pendingJob); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	return &pendingJob, nil
}

// SubmitResults POSTs the final telemetry back to the database.
func SubmitResults(submissionID string, passedTests bool, execTimeSeconds float64, tokens int) error {
	url := fmt.Sprintf("%s/api/submissions/results", getBaseURL())

	payload := SubmitResultsRequest{
		SubmissionID: submissionID,
		JudgeAPIKey:  demoJudgeKey,
		Metrics: ExecutionMetrics{
			PassedTests:          passedTests,
			ExecutionTimeSeconds: execTimeSeconds,
			TokensUsed:           tokens,
		},
	}

	jsonValue, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON payload: %w", err)
	}

	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		return fmt.Errorf("network error during submission: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("web platform rejected submission (Status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

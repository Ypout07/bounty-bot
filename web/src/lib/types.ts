export type ChallengeStatus = "submitted" | "ongoing" | "unattempted" | "expired";

export interface Challenge {
  id: string;
  title: string;
  company: string;
  description: string;
  request: string;
  postedAt: string;      // ISO date string
  startDate: string;     // ISO date string — when the challenge opens
  deadline: string;       // ISO date string
  status: ChallengeStatus;
  submissionCount: number;
  repoUrl?: string;
}

export interface ProviderChallenge extends Challenge {
  metrics: string[];
}

export type SubmissionStatus = "pending" | "processing" | "completed" | "failed";

export interface Submission {
  id: string;
  createdAt: string;        // ISO date string — used for FIFO ordering
  problemId: string;        // which challenge this submission is for
  dockerImageTag: string;   // e.g. "student/golden-agent:v1"
  status: SubmissionStatus;
  passedTests: boolean;
  executionTimeSeconds: number;
  tokensUsed: number;
}

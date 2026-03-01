import { ProviderChallenge } from "./types";

export const mockProviderChallenges: ProviderChallenge[] = [
  {
    id: "p1",
    title: "Intelligent Code Review Agent",
    company: "Creevo",
    description:
      "Build an AI-powered code review agent that analyzes pull requests for bugs, security vulnerabilities, and style violations. The agent must provide actionable inline comments and an overall summary with a confidence score for each finding.",
    request: "",
    postedAt: "2026-01-10T09:00:00Z",
    startDate: "2026-01-12T00:00:00Z",
    deadline: "2026-01-26T23:59:00Z",
    submissionCount: 38,
    metrics: ["precision", "recall", "false positive rate"],
    repoUrl: "https://github.com/creevo/code-review-***",
    status: "expired",
  },
  {
    id: "p2",
    title: "Automated Test Generation Engine",
    company: "Creevo",
    description:
      "Create an agent that automatically generates unit tests for untested functions in a codebase. The agent should achieve at least 80% branch coverage on the target modules and produce tests that are readable, maintainable, and catch real bugs.",
    request: "",
    postedAt: "2026-02-01T14:00:00Z",
    startDate: "2026-02-03T00:00:00Z",
    deadline: "2026-02-17T23:59:00Z",
    submissionCount: 22,
    metrics: ["branch coverage", "mutation score", "execution time"],
    repoUrl: "https://github.com/creevo/test-gen-***",
    status: "expired",
  },
];

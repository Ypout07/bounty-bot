"use client";

import { useState, useRef, useMemo } from "react";
import { ProviderChallenge } from "@/lib/types";

const PRESET_METRICS = [
  "Accuracy",
  "AUC",
  "Cost reduction %",
  "Data freshness",
  "Execution time",
  "F1 score",
  "False positive rate",
  "Inference time",
  "Latency",
  "Memory usage",
  "p95 latency",
  "Pipeline reliability",
  "Test coverage",
  "Throughput",
  "Tokens used",
];

interface ChallengeFormProps {
  onSubmit: (challenge: ProviderChallenge) => void;
}

export default function ChallengeForm({ onSubmit }: ChallengeFormProps) {
  const [title, setTitle] = useState("Agentic Debugging Assistant");
  const [description, setDescription] = useState(
    "Build an AI agent that autonomously diagnoses and fixes bugs in a Python codebase. Given a failing test suite, the agent must localize the fault, propose a fix, and validate it by re-running the tests — all without human intervention."
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["Execution time", "Tokens used", "Pass/Fail"]);
  const [metricSearch, setMetricSearch] = useState("");
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const metricInputRef = useRef<HTMLInputElement>(null);
  const [request, setRequest] = useState(`## Objective

Build an autonomous AI agent that can **diagnose, localize, and fix bugs** in a Python codebase — without any human intervention. Your agent will be given a repository with a failing test suite and must produce a working fix.

---

## Requirements

Your agent must perform the following steps **end-to-end**:

1. **Clone & Explore** — Clone the provided repository and map out the project structure (files, modules, dependencies).
2. **Run the Test Suite** — Execute the existing tests and capture the failing test output, including stack traces.
3. **Fault Localization** — Analyze the stack trace and source code to identify the root cause of each failure. Your agent should narrow down to the exact file and line number.
4. **Generate a Fix** — Propose a minimal code change that resolves the bug without introducing regressions.
5. **Validate** — Re-run the full test suite to confirm all tests pass after applying the fix.
6. **Report** — Produce a brief summary of what was broken and how it was fixed.

---

## Deliverables

| File | Description |
|------|-------------|
| \`agent.py\` | Main agent entry point |
| \`tools.py\` | Any custom tools your agent uses |
| \`prompt.py\` | System prompts and guidelines |
| \`report.md\` | Summary of bugs found and fixes applied |

---

## Evaluation Criteria

Your submission will be scored on the following metrics:

- **Pass Rate** — What percentage of the failing tests does your agent fix? *(50% of score)*
- **Token Efficiency** — How many LLM tokens does your agent consume to reach a solution? Lower is better. *(20% of score)*
- **Execution Time** — Wall-clock time from start to a passing test suite. *(20% of score)*
- **Code Quality** — Are the fixes minimal, clean, and free of side effects? *(10% of score)*

> **Target:** Fix all failing tests in under 5 minutes using fewer than 50,000 tokens.

---

## Constraints

- You **must** use the [CAL framework](https://github.com/Creevo-App/creevo-agent-library) to build your agent.
- Your agent may only modify files in the \`src/\` directory — test files are **read-only**.
- Maximum of **10 tool calls** per run.
- No internet access during evaluation — all dependencies must be pre-installed.

---

## Getting Started

### 1. Install dependencies

\`\`\`bash
pip install creevo-agent-library[mcp] python-dotenv
\`\`\`

### 2. Set up your environment

Create a \`.env\` file in your project root:

\`\`\`bash
GEMINI_API_KEY=your_key_here
\`\`\`

### 3. Set up your agent

\`\`\`python
import os
from CAL import Agent, GeminiLLM, StopTool, FullCompressionMemory
from dotenv import load_dotenv
from tools import get_file_structure_context, read_contents_of_file, execute_file, write_file
from prompt import SYSTEM_PROMPT

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=4096)
summarizer_llm = GeminiLLM(model="gemini-3-flash-preview", api_key=api_key, max_tokens=2048)
memory = FullCompressionMemory(summarizer_llm=summarizer_llm, max_tokens=50000)

agent = Agent(
    llm=llm,
    system_prompt=SYSTEM_PROMPT,
    max_calls=10,
    max_tokens=4096,
    memory=memory,
    agent_name="DebugBot",
    tools=[StopTool(), get_file_structure_context, read_contents_of_file, execute_file, write_file]
)
\`\`\`

### 4. Run your agent

\`\`\`python
result = agent.run("Find the main source code and run it. Look at the stacktrace and tell me what is the problem in simple terms")
print(result.content)
\`\`\`

> Download the full starter template (with \`tools.py\` and \`prompt.py\`) from the **Resources** tab or the **Get Started** page.

Good luck!`);
  const [repoUrl, setRepoUrl] = useState("https://github.com/fundav/raikes-hacks-student-repo");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const challenge: ProviderChallenge = {
      id: "p" + Date.now(),
      title: title.trim(),
      company: "Creevo",
      description: description.trim(),
      request: request.trim(),
      status: "unattempted",
      postedAt: new Date().toISOString(),
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      metrics: selectedMetrics,
      repoUrl: repoUrl.trim(),
      submissionCount: 0,
    };

    onSubmit(challenge);
    setTitle("");
    setDescription("");
    setSelectedMetrics([]);
    setMetricSearch("");
    setRequest("");
    setRepoUrl("");
    setStartDate(() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    });
    setDeadline("");
  }

  const inputClass =
    "w-full bg-surface-overlay border border-surface-hover rounded-lg py-2.5 px-4 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 bg-surface-overlay flex-shrink-0">
        <h1 className="text-2xl font-bold text-heading">Post New Challenge</h1>
        <p className="text-muted text-sm mt-1">
          Define the problem, set your metrics, and share the repository.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder="Challenge title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Describe the problem and what participants need to accomplish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[120px] resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Metrics
            </label>
            <div className="relative">
              <input
                ref={metricInputRef}
                type="text"
                placeholder="Search or add metrics..."
                value={metricSearch}
                onChange={(e) => {
                  setMetricSearch(e.target.value);
                  setMetricDropdownOpen(true);
                }}
                onFocus={() => setMetricDropdownOpen(true)}
                onBlur={() => setTimeout(() => setMetricDropdownOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && metricSearch.trim()) {
                    e.preventDefault();
                    const val = metricSearch.trim();
                    if (!selectedMetrics.includes(val)) {
                      setSelectedMetrics([...selectedMetrics, val]);
                    }
                    setMetricSearch("");
                  }
                }}
                className={inputClass}
              />
              {metricDropdownOpen && (() => {
                const q = metricSearch.toLowerCase();
                const filtered = PRESET_METRICS.filter(
                  (m) => m.toLowerCase().includes(q) && !selectedMetrics.includes(m)
                );
                if (filtered.length === 0) return null;
                return (
                  <div className="absolute z-10 w-full mt-1 bg-surface-overlay border border-surface-hover rounded-lg shadow-md max-h-32 overflow-y-auto">
                    {filtered.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedMetrics([...selectedMetrics, m]);
                          setMetricSearch("");
                          metricInputRef.current?.focus();
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-heading hover:bg-surface-hover transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            {selectedMetrics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedMetrics.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => setSelectedMetrics(selectedMetrics.filter((s) => s !== m))}
                      className="hover:text-red-500 transition-colors"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Repository URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              End Date
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Request
            </label>
            <p className="text-xs text-muted mb-2">
              Provide the full task breakdown, expected deliverables, evaluation criteria, and any specific metrics or improvements you're looking for.
            </p>
            <textarea
              placeholder="e.g. Build an agent that ingests a live stream of events and classifies each as legitimate or fraudulent. Your agent must:&#10;&#10;1. Connect to the provided broker...&#10;2. Extract features and run them through a detection model...&#10;&#10;You will be evaluated on detection accuracy (F1 score), latency, and false positive rate."
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className={`${inputClass} min-h-[240px] resize-y`}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors mt-8"
        >
          Post Challenge
        </button>
      </form>
    </div>
  );
}

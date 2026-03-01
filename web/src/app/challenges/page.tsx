"use client";

import { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight } from "prism-react-renderer";
import Link from "next/link";
import JSZip from "jszip";
import { Challenge } from "@/lib/types";
import { fetchChallenges } from "@/lib/challenges";
import ChallengeList from "@/components/ChallengeList";
import Navbar from "@/components/Navbar";
import { downloadStarterTemplate } from "@/lib/templateFiles";

const lightColorful = {
  plain: { color: "#1d1d1f", backgroundColor: "#f5f5f7" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#6a737d" } },
    { types: ["punctuation"], style: { color: "#444" } },
    { types: ["property", "tag", "boolean", "number", "constant", "symbol"], style: { color: "#0550ae" } },
    { types: ["attr-name", "string", "char", "builtin", "inserted"], style: { color: "#22863a" } },
    { types: ["operator", "entity", "url"], style: { color: "#d63384" } },
    { types: ["atrule", "attr-value", "keyword"], style: { color: "#cf222e" } },
    { types: ["function", "class-name"], style: { color: "#8250df" } },
    { types: ["regex", "important", "variable"], style: { color: "#e36209" } },
    { types: ["decorator", "annotation"], style: { color: "#e36209" } },
    { types: ["triple-quoted-string", "template-string"], style: { color: "#22863a" } },
  ],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const markdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");

    if (!match) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-surface-overlay text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    return (
      <Highlight theme={lightColorful} code={code} language={match[1]}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="rounded-xl p-4 mb-4 overflow-x-auto text-xs leading-relaxed border border-surface-hover"
            style={{ ...style }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    );
  },
  pre({ children }: any) {
    return <>{children}</>;
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type Tab = "Request" | "Resources" | "Upload" | "Leader Board";

const MOCK_LEADERBOARD = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  team: [
    "AgentSmith", "BugSquasher", "FixItFelix", "CodeMonkey", "NullPointer",
    "StackTrace", "ByteMe", "GitGud", "DevDynamo", "SyntaxError",
    "PatchWork", "Debugger9k", "LoopBreaker", "RefactorX", "CompileKing",
    "HotFixer", "TestPilot", "CacheMiss", "Overflow", "BitShifter",
  ][i],
  score: Math.round(980 - i * 32 + (Math.random() * 10 - 5)),
  passed: `${Math.max(12 - Math.floor(i / 3), 4)}/12`,
  avgTime: `${1 + Math.floor(i * 0.4)}m ${String(Math.floor(Math.random() * 59)).padStart(2, "0")}s`,
  tokens: Math.round(15000 + i * 2800 + Math.random() * 1000),
}));

interface LeaderboardEntry {
  problem_id: string;
  docker_image_tag: string;
  total_submissions: number;
  passed: number;
  avg_execution_time: number;
  avg_tokens_used: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function isPlayer(tag: string): boolean {
  return !tag.startsWith("mock/") || tag === "mock/golden";
}

function calculateScore(entry: LeaderboardEntry): number {
  const passRate = entry.total_submissions > 0 ? entry.passed / entry.total_submissions : 0;
  const passScore = passRate * 500;
  const timeScore = Math.max(0, 300 - (entry.avg_execution_time / 300) * 300);
  const tokenScore = Math.max(0, 200 - (entry.avg_tokens_used / 50000) * 200);
  return Math.round(passScore + timeScore + tokenScore);
}

function isAgenticDebugging(challenge: Challenge): boolean {
  return challenge.title === "Agentic Debugging Assistant" && challenge.company === "Creevo";
}

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [view, setView] = useState<"trending" | "library">("trending");
  const [activeTab, setActiveTab] = useState<Tab>("Request");
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submittedChallenges, setSubmittedChallenges] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("submittedChallenges");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [agentChoice, setAgentChoice] = useState<"mock/golden" | "nathanm1307/student-submissionv:v10" | "custom">("mock/golden");
  const [customTag, setCustomTag] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    fetchChallenges().then((data) => {
      setChallenges(data);
      const now = Date.now();
      // Match ChallengeList's default "recent" sort: started + non-expired, sorted by postedAt desc
      const recent = data
        .filter((c) => c.status !== "expired" && new Date(c.startDate).getTime() <= now)
        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      if (recent.length > 0) setSelected(recent[0]);
      else if (data.length > 0) setSelected(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected || activeTab !== "Leader Board" || !isAgenticDebugging(selected)) return;
    fetch(`/api/leaderboard?challengeId=${selected.id}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch(() => setLeaderboard([]));
  }, [selected, activeTab]);

  const library = useMemo(
    () => challenges.filter((c) => c.status === "submitted" || c.status === "ongoing" || c.status === "expired"),
    [challenges]
  );

  const allChallenges = useMemo(
    () => challenges.filter((c) => c.status !== "expired"),
    [challenges]
  );

  const displayedChallenges = view === "trending" ? allChallenges : library;

  if (loading) {
    return (
      <main className="flex flex-col h-screen overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          Loading challenges...
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 gap-px bg-surface-hover">
        {/* Left — Challenge list */}
        <div className="flex-1 min-w-0 p-6 min-h-0 bg-white">
          <ChallengeList
            heading={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("trending")}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    view === "trending"
                      ? "text-heading"
                      : "text-muted hover:text-body"
                  }`}
                >
                  Challenges
                </button>
                <span className="text-surface-hover">|</span>
                <button
                  onClick={() => setView("library")}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    view === "library"
                      ? "text-heading"
                      : "text-muted hover:text-body"
                  }`}
                >
                  Your Challenges
                </button>
              </div>
            }
            challenges={displayedChallenges}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* Right — Description + tabs */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {selected ? (
            <>
              {/* Dynamic description */}
              <section className="p-6 pb-5 flex-shrink-0 bg-surface-overlay">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                  {selected.company}
                </h2>
                <h1 className="text-3xl font-bold text-heading mb-3">
                  {selected.title}
                </h1>
                <p className="text-muted text-sm leading-relaxed">
                  {selected.description}
                </p>
              </section>

              {/* Tab bar */}
              <div className="px-6 border-b border-surface-hover flex-shrink-0 bg-surface-raised">
                <div className="flex gap-0">
                  {(["Request", "Resources", "Upload", "Leader Board"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab
                          ? "text-heading border-heading"
                          : "text-muted hover:text-heading border-transparent"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content area */}
              <div className="flex-1 min-h-0 p-6 overflow-y-auto">
                {activeTab === "Request" && (
                  <article className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {selected.request}
                    </ReactMarkdown>
                  </article>
                )}

                {activeTab === "Leader Board" && selected && isAgenticDebugging(selected) && (
                  <div className="rounded-xl border border-surface-hover overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-overlay text-xs uppercase tracking-wider text-muted">
                          <th className="text-left px-4 py-2.5 font-semibold w-12">#</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Team</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Score</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Passed</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Avg Time</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...leaderboard].sort((a, b) => calculateScore(b) - calculateScore(a)).map((entry, i) => {
                          const rank = i + 1;
                          const you = isPlayer(entry.docker_image_tag);
                          return (
                            <tr
                              key={entry.docker_image_tag}
                              className={`border-t ${you ? "border-accent/30 bg-accent/5 ring-1 ring-accent/20" : "border-surface-hover"}`}
                            >
                              <td className={`px-4 py-2.5 font-bold ${
                                you ? "text-accent" :
                                rank === 1 ? "text-yellow-500" :
                                rank === 2 ? "text-gray-400" :
                                rank === 3 ? "text-amber-600" : "text-muted"
                              }`}>
                                {rank}
                              </td>
                              <td className={`px-4 py-2.5 font-medium ${
                                you ? "text-accent" :
                                rank === 1 ? "text-yellow-500" :
                                rank === 2 ? "text-gray-400" :
                                rank === 3 ? "text-amber-600" : "text-heading"
                              }`}>{you ? "YOU" : entry.docker_image_tag}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-heading">{calculateScore(entry)}</td>
                              <td className="px-4 py-2.5 text-right text-body">{entry.passed}/{entry.total_submissions}</td>
                              <td className="px-4 py-2.5 text-right text-body">{formatTime(entry.avg_execution_time)}</td>
                              <td className="px-4 py-2.5 text-right text-muted">{Math.round(entry.avg_tokens_used).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "Leader Board" && selected && !isAgenticDebugging(selected) && (
                  <div className="rounded-xl border border-surface-hover overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-overlay text-xs uppercase tracking-wider text-muted">
                          <th className="text-left px-4 py-2.5 font-semibold w-12">#</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Team</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Score</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Passed</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Avg Time</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_LEADERBOARD.map((entry) => (
                          <tr
                            key={entry.rank}
                            className="border-t border-surface-hover"
                          >
                            <td className={`px-4 py-2.5 font-bold ${
                              entry.rank === 1 ? "text-yellow-500" :
                              entry.rank === 2 ? "text-gray-400" :
                              entry.rank === 3 ? "text-amber-600" : "text-muted"
                            }`}>
                              {entry.rank}
                            </td>
                            <td className={`px-4 py-2.5 font-medium ${
                              entry.rank === 1 ? "text-yellow-500" :
                              entry.rank === 2 ? "text-gray-400" :
                              entry.rank === 3 ? "text-amber-600" : "text-heading"
                            }`}>{entry.team}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-heading">{entry.score}</td>
                            <td className="px-4 py-2.5 text-right text-body">{entry.passed}</td>
                            <td className="px-4 py-2.5 text-right text-body">{entry.avgTime}</td>
                            <td className="px-4 py-2.5 text-right text-muted">{entry.tokens.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "Resources" && (
                  <div className="space-y-6">
                    {/* Download starter template */}
                    <div className="rounded-xl border border-surface-hover p-5">
                      <h3 className="text-sm font-semibold text-heading mb-1">
                        Starter Template
                      </h3>
                      <p className="text-xs text-muted mb-4">
                        Download the starter files to get up and running quickly.
                      </p>
                      <button
                        onClick={downloadStarterTemplate}
                        className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-full hover:bg-accent-dim transition-colors"
                      >
                        Download Starter Template
                      </button>
                    </div>

                    {/* Challenge repo link */}
                    {selected.repoUrl && (
                      <div className="rounded-xl border border-surface-hover p-5">
                        <h3 className="text-sm font-semibold text-heading mb-1">
                          Challenge Repository
                        </h3>
                        <p className="text-xs text-muted mb-4">
                          View the repository for this challenge.
                        </p>
                        <a
                          href={selected.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dim transition-colors"
                        >
                          {selected.repoUrl}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </a>
                      </div>
                    )}

                    {/* Get started link */}
                    <Link
                      href="/get-started"
                      className="group flex items-center justify-between rounded-xl border border-surface-hover p-5 hover:border-accent/30 transition-colors"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-heading mb-1">
                          Need help getting started?
                        </h3>
                        <p className="text-xs text-muted">
                          Check out the full tutorial and setup guide.
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}

                {activeTab === "Upload" && selected && (
                  submittedChallenges.has(selected.id) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-heading mb-1">Submission Received</h3>
                      <p className="text-sm text-muted max-w-sm">
                        Your agent has been submitted and is being evaluated. Check the Leader Board tab for results.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4 text-sm text-body">
                        <div className="flex gap-3">
                          <span className="text-accent font-bold flex-shrink-0">1.</span>
                          <p><span className="font-semibold text-heading">Code:</span> Write your agent logic inside the provided template. <span className="font-semibold text-heading">Never hardcode API keys;</span> our orchestrator securely injects them at runtime.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-accent font-bold flex-shrink-0">2.</span>
                          <p><span className="font-semibold text-heading">Containerize:</span> Build and push your agent to Docker Hub: <code className="px-1.5 py-0.5 rounded bg-surface-overlay text-xs font-mono">docker build -t your-username/agent:v1 . && docker push your-username/agent:v1</code></p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-accent font-bold flex-shrink-0">3.</span>
                          <p><span className="font-semibold text-heading">Submit:</span> Paste your exact Docker Hub image tag (<code className="px-1.5 py-0.5 rounded bg-surface-overlay text-xs font-mono">your-username/agent:v1</code>) into the Bounty Bot web portal to enter the execution queue.</p>
                        </div>
                      </div>

                      <div className="border-t border-surface-hover" />

                      <div className="max-w-md mx-auto space-y-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Team Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your team name..."
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full bg-surface-overlay border border-surface-hover rounded-lg py-2.5 px-4 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                          Select Agent
                        </label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setAgentChoice("mock/golden")}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              agentChoice === "mock/golden"
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-surface-hover hover:border-accent/30"
                            }`}
                          >
                            <p className="text-sm font-semibold text-heading">Quick Test</p>
                            <p className="text-xs text-muted mt-0.5">
                              Run the golden baseline agent — results in under a minute
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAgentChoice("nathanm1307/student-submissionv:v10")}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              agentChoice === "nathanm1307/student-submissionv:v10"
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-surface-hover hover:border-accent/30"
                            }`}
                          >
                            <p className="text-sm font-semibold text-heading">Full Submission</p>
                            <p className="text-xs text-muted mt-0.5">
                              Submit your actual agent — evaluation may take up to 5 minutes
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAgentChoice("custom")}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              agentChoice === "custom"
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-surface-hover hover:border-accent/30"
                            }`}
                          >
                            <p className="text-sm font-semibold text-heading">Independent Submission</p>
                            <p className="text-xs text-muted mt-0.5">
                              Submit your own Docker Hub image tag
                            </p>
                            {agentChoice === "custom" && (
                              <input
                                type="text"
                                placeholder="your-username/agent:v1"
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3 w-full bg-white border border-surface-hover rounded-lg py-2 px-3 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all font-mono"
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        disabled={submitting || !teamName.trim() || (agentChoice === "custom" && !customTag.trim())}
                        onClick={async () => {
                          if (!selected) return;
                          setSubmitting(true);
                          try {
                            const res = await fetch("/api/submissions", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                problem_id: selected.id,
                                docker_image_tag: agentChoice === "custom" ? customTag.trim() : agentChoice,
                              }),
                            });
                            if (res.ok) {
                              setSubmittedChallenges((prev) => {
                                const next = new Set(prev).add(selected.id);
                                localStorage.setItem("submittedChallenges", JSON.stringify([...next]));
                                return next;
                              });
                              setTeamName("");
                            }
                          } catch (err) {
                            console.error("Submission failed:", err);
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                        className="w-full bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Agent"}
                      </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              No challenges available
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

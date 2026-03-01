"use client";

import { useState, useEffect } from "react";
import { ProviderChallenge } from "@/lib/types";

interface LeaderboardEntry {
  problem_id: string;
  docker_image_tag: string;
  total_submissions: number;
  passed: number;
  avg_execution_time: number;
  avg_tokens_used: number;
}

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

function isAgenticDebugging(challenge: ProviderChallenge): boolean {
  return challenge.title === "Agentic Debugging Assistant" && challenge.company === "Creevo";
}

function getTimeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ProviderChallengeDetailProps {
  challenge: ProviderChallenge;
}

export default function ProviderChallengeDetail({
  challenge,
}: ProviderChallengeDetailProps) {
  const timeRemaining = getTimeRemaining(challenge.deadline);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isAgenticDebugging(challenge)) return;
    fetch(`/api/leaderboard?challengeId=${challenge.id}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch(() => setLeaderboard([]));
  }, [challenge.id, challenge.title, challenge.company]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-5 bg-surface-overlay flex-shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
          {challenge.company}
        </h2>
        <h1 className="text-2xl font-bold text-heading mb-2">
          {challenge.title}
        </h1>
        <p className="text-muted text-sm leading-relaxed">
          {challenge.description}
        </p>
      </div>

      {/* Stats row */}
      <div className="px-6 py-4 border-b border-surface-hover bg-surface-raised flex-shrink-0">
        <div className="flex gap-3">
          {[
            { label: "Submissions", value: String(challenge.submissionCount) },
            { label: "Time Left", value: timeRemaining },
            { label: "Metrics", value: String(challenge.metrics.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-surface-overlay rounded-lg px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-heading">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
        {/* Metrics */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Target Metrics
          </h3>
          <div className="flex flex-wrap gap-2">
            {challenge.metrics.map((m) => (
              <span
                key={m}
                className="inline-flex px-3 py-1 bg-surface-overlay rounded-full text-xs text-heading font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Repository */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Repository
          </h3>
          <p className="font-mono text-sm text-accent bg-surface-overlay px-4 py-2.5 rounded-lg">
            {challenge.repoUrl}
          </p>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Timeline
          </h3>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted text-xs">Posted</p>
              <p className="text-heading font-medium">{formatDate(challenge.postedAt)}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Deadline</p>
              <p className="text-heading font-medium">{formatDate(challenge.deadline)}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-hover" />

        {/* Leader Board */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Leader Board
          </h3>
          {isAgenticDebugging(challenge) ? (
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
          ) : (
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
        </div>
      </div>
    </div>
  );
}

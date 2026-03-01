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

// TODO: Replace with API call — fetch(`/api/leaderboard?challengeId=${challenge.id}`)
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

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [view, setView] = useState<"trending" | "library">("trending");
  const [activeTab, setActiveTab] = useState<Tab>("Request");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges().then((data) => {
      setChallenges(data);
      if (data.length > 0) setSelected(data[0]);
      setLoading(false);
    });
  }, []);

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

                {activeTab === "Leader Board" && (
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
                            className={`border-t border-surface-hover ${""}`}
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

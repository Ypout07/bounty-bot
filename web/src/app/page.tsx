"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const COMPANIES = [
  { name: "Jane Street", color: "text-muted/50", large: false },
  { name: "Cloudflare", color: "text-muted/50", large: false },
  { name: "Anthropic", color: "text-muted/50", large: false },
  { name: "Creevo", color: "text-pink-500", large: true },
  { name: "DineU", color: "text-red-500", large: true },
  { name: "FindU", color: "text-red-500", large: true },
  { name: "Reach", color: "text-green-500", large: true },
  { name: "Coinbase", color: "text-muted/50", large: false },
  { name: "Capital One", color: "text-muted/50", large: false },
  { name: "Elasticsearch", color: "text-muted/50", large: false },
];

const STEPS = [
  {
    number: "01",
    title: "Pick a Challenge",
    description:
      "Browse real-world problems posted by top tech companies. Each challenge is scoped to be solvable in a weekend.",
  },
  {
    number: "02",
    title: "Build an AI Agent",
    description:
      "Use our starter template and the CAL framework to build an intelligent agent that tackles your chosen problem.",
  },
  {
    number: "03",
    title: "Submit & Compete",
    description:
      "Upload your solution before the deadline. Solutions are scored and ranked on a live leaderboard.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="max-w-3xl mx-auto px-8 pt-28 pb-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-5">
            Raikes Center &middot; Spring 2026
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold text-heading leading-[1.08] tracking-tight mb-6">
            Solve real problems.
            <br />
            <span className="text-accent">Build AI agents.</span>
          </h1>
          <p className="text-lg text-body leading-relaxed max-w-xl mx-auto mb-10">
            BountyBot pairs you with challenges from top tech companies.
            Build intelligent agents, compete on a live leaderboard, and
            showcase your skills.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/get-started"
              className="px-10 py-4 text-base font-medium text-white bg-accent rounded-full hover:bg-accent-dim transition-colors shadow-sm"
            >
              Get Started
            </Link>
            <Link
              href="/company"
              className="text-xs text-accent underline hover:text-accent-dim transition-colors"
            >
              Company View
            </Link>
          </div>
        </div>
      </section>

      {/* Company logos ticker */}
      <section className="border-y border-surface-hover bg-surface-hover/60 py-6">
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted text-center mb-5">
            Challenges from industry leaders
          </p>
          <div className="flex items-center justify-center gap-x-10 flex-nowrap">
            {COMPANIES.map((company) => (
              <span
                key={company.name}
                className={`${company.large ? "text-lg" : "text-sm"} font-medium ${company.color} cursor-default whitespace-nowrap`}
              >
                {company.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-heading tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Three steps from signup to the leaderboard. Everything you need is
            provided.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group p-6 rounded-2xl border border-surface-hover bg-white hover:border-accent/20 hover:shadow-sm transition-all"
            >
              <span className="inline-block text-xs font-bold text-accent mb-4">
                {step.number}
              </span>
              <h3 className="text-base font-semibold text-heading mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlight section */}
      <section className="bg-surface-hover/30">
        <div className="max-w-4xl mx-auto px-8 py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-heading tracking-tight mb-4">
                Real challenges,
                <br />
                real impact.
              </h2>
              <p className="text-sm text-body leading-relaxed mb-6">
                Every challenge comes from a real engineering problem at a real
                company. You&apos;ll work on fraud detection, search
                optimization, rate limiting, smart contract security, and more.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Production-grade problem statements",
                  "Starter templates & documentation",
                  "Live scoring & leaderboard",
                  "Direct company visibility",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-sm text-body">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-surface-hover bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 rounded bg-surface-overlay" />
                  <div className="h-3 w-full rounded bg-surface-overlay" />
                  <div className="h-3 w-5/6 rounded bg-surface-overlay" />
                  <div className="h-8 w-2/3 rounded-lg bg-accent/10 mt-4" />
                  <div className="h-3 w-full rounded bg-surface-overlay" />
                  <div className="h-3 w-4/5 rounded bg-surface-overlay" />
                  <div className="h-3 w-2/3 rounded bg-surface-overlay" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-xl border border-surface-hover bg-white px-4 py-3 shadow-md">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-0.5">
                  Score
                </p>
                <p className="text-lg font-bold text-heading">98.4</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-8 py-28 text-center">
        <h2 className="text-3xl font-bold text-heading tracking-tight mb-4">
          Ready to build?
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-8">
          Join Raikes Hacks, pick a challenge, and start building your AI agent
          today.
        </p>
        <Link
          href="/get-started"
          className="inline-block px-7 py-3 text-sm font-medium text-white bg-accent rounded-full hover:bg-accent-dim transition-colors shadow-sm"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-hover py-8 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted">
            Raikes Hacks &middot; Raikes Center &middot; University of
            Nebraska&ndash;Lincoln
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/challenges"
              className="text-xs text-muted hover:text-heading transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/get-started"
              className="text-xs text-muted hover:text-heading transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

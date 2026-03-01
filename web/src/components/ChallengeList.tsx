"use client";

import { useState, useMemo } from "react";
import { Challenge } from "@/lib/types";
import ChallengeCard from "./ChallengeCard";

type SortKey = "trending" | "deadline-soonest" | "deadline-latest" | "upcoming-soonest" | "upcoming-latest" | "recent";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "trending", label: "Trending" },
  { key: "deadline-soonest", label: "Deadline: Soonest" },
  { key: "deadline-latest", label: "Deadline: Latest" },
  { key: "upcoming-soonest", label: "Upcoming: Soonest" },
  { key: "upcoming-latest", label: "Upcoming: Latest" },
];

interface ChallengeListProps {
  heading: React.ReactNode;
  challenges: Challenge[];
  selectedId: string | null;
  onSelect: (challenge: Challenge) => void;
  action?: React.ReactNode;
}

export default function ChallengeList({
  heading,
  challenges,
  selectedId,
  onSelect,
  action,
}: ChallengeListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const isRecent = sort === "recent";
    const isUpcoming = sort === "upcoming-soonest" || sort === "upcoming-latest";
    const isDeadline = sort === "deadline-soonest" || sort === "deadline-latest";
    const now = Date.now();
    let list = challenges.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (isRecent) return new Date(c.startDate).getTime() <= now;
      if (isUpcoming) return new Date(c.startDate).getTime() > now;
      if (isDeadline) return new Date(c.startDate).getTime() <= now;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sort === "trending") {
        cmp = b.submissionCount - a.submissionCount;
      } else if (sort === "deadline-soonest") {
        cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (sort === "deadline-latest") {
        cmp = new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      } else if (sort === "upcoming-soonest") {
        cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sort === "upcoming-latest") {
        cmp = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      } else if (sort === "recent") {
        cmp = new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
      // break ties alphabetically by title
      return cmp !== 0 ? cmp : a.title.localeCompare(b.title);
    });

    return list;
  }, [challenges, search, sort]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        {typeof heading === "string" ? (
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {heading}
          </h2>
        ) : (
          heading
        )}
        {action}
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search challenges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-overlay border border-surface-hover rounded-lg py-2 pl-10 pr-4 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
      </div>

      {/* Sort toggles */}
      <div className="flex gap-1.5 mb-4">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              sort === opt.key
                ? "bg-accent text-white"
                : "bg-surface-overlay text-muted hover:text-heading"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-hide">
        {filtered.length === 0 && (
          <p className="text-muted text-sm py-8 text-center">No challenges found.</p>
        )}
        {filtered.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            isSelected={selectedId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

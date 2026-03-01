"use client";

import { useState, useEffect } from "react";
import { Challenge, ProviderChallenge } from "@/lib/types";
import { fetchProviderChallenges, createChallenge } from "@/lib/challenges";
import ChallengeList from "@/components/ChallengeList";
import ProviderNavbar from "@/components/ProviderNavbar";
import ChallengeForm from "@/components/ChallengeForm";
import ProviderChallengeDetail from "@/components/ProviderChallengeDetail";

export default function CompanyPage() {
  const [challenges, setChallenges] = useState<ProviderChallenge[]>([]);
  const [selected, setSelected] = useState<ProviderChallenge | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderChallenges().then((data) => {
      setChallenges(data);
      if (data.length > 0) setSelected(data[0]);
      setLoading(false);
    });
  }, []);

  function handleSelect(challenge: Challenge) {
    const full = challenges.find((c) => c.id === challenge.id);
    if (full) {
      setSelected(full);
      setShowForm(false);
    }
  }

  function handleNewChallenge() {
    setSelected(null);
    setShowForm(true);
  }

  async function handleSubmit(newChallenge: ProviderChallenge) {
    const saved = await createChallenge({
      title: newChallenge.title,
      company: newChallenge.company,
      description: newChallenge.description,
      request: newChallenge.request,
      deadline: newChallenge.deadline,
      metrics: newChallenge.metrics,
      repoUrl: newChallenge.repoUrl,
    });

    if (saved) {
      setChallenges((prev) => [saved, ...prev]);
    }
    setShowForm(false);
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <ProviderNavbar />
      <div className="flex flex-1 min-h-0 gap-px bg-surface-hover">
        {/* Left — Provider's challenges */}
        <div className="flex-1 min-w-0 p-6 min-h-0 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Loading challenges...
            </div>
          ) : (
            <ChallengeList
              heading="Your Challenges"
              challenges={challenges}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              action={
                <button
                  onClick={handleNewChallenge}
                  className="px-5 py-2.5 text-sm font-medium rounded-full bg-accent text-white hover:bg-accent-dim transition-colors"
                >
                  Create New Challenge
                </button>
              }
            />
          )}
        </div>

        {/* Right — Detail or Form */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {showForm ? (
            <ChallengeForm onSubmit={handleSubmit} />
          ) : selected ? (
            <ProviderChallengeDetail challenge={selected} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a challenge or create a new one
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

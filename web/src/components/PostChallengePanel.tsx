"use client";

import { useEffect, useState } from "react";

interface PostChallengePanelProps {
  onContinue: () => void;
}

function useOS(): "mac" | "windows" | "unknown" {
  const [os, setOS] = useState<"mac" | "windows" | "unknown">("unknown");

  useEffect(() => {
    const platform = navigator.platform?.toLowerCase() ?? "";
    const userAgent = navigator.userAgent?.toLowerCase() ?? "";

    if (platform.includes("mac") || userAgent.includes("macintosh")) {
      setOS("mac");
    } else if (platform.includes("win") || userAgent.includes("windows")) {
      setOS("windows");
    }
  }, []);

  return os;
}

export default function PostChallengePanel({ onContinue }: PostChallengePanelProps) {
  const os = useOS();

  const repoZipUrl = "https://github.com/fundav/raikes-hacks-company-repo/archive/refs/heads/main.zip";
  const executableUrl =
    os === "mac"
      ? "/downloads/orchestrator"
      : "/downloads/orchestrator.exe";
  const executableLabel =
    os === "mac" ? "macOS orchestrator" : os === "windows" ? "Windows orchestrator" : "Orchestrator";

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 bg-surface-overlay flex-shrink-0">
        <h1 className="text-2xl font-bold text-heading">Challenge Created</h1>
        <p className="text-muted text-sm mt-1">
          Download the starter resources to get set up.
        </p>
      </div>

      <div className="flex-1 p-6 space-y-5">
        {/* 1. Repo ZIP download link */}
        <div>
            <p className="text-sm font-semibold text-heading">Starter Repository</p>
            <p className="text-xs text-muted mt-0.5 mb-1.5">
              Download the zipped starter repo template
            </p>
            <a
              href={repoZipUrl}
              download
              className="text-sm text-accent underline underline-offset-2 hover:text-accent-dim transition-colors"
            >
              Download .zip
            </a>
        </div>

        {/* 2. Executable download link (OS-detected) */}
        <div>
            <p className="text-sm font-semibold text-heading">Evaluation Tool</p>
            <p className="text-xs text-muted mt-0.5 mb-1.5">
              {os === "mac"
                ? "Detected macOS — download the evaluation tool"
                : os === "windows"
                ? "Detected Windows — download the evaluation tool"
                : "Download the evaluation tool for your platform"}
            </p>
            <a
              href={executableUrl}
              download
              className="text-sm text-accent underline underline-offset-2 hover:text-accent-dim transition-colors"
            >
              Download {executableLabel}
            </a>
        </div>
      </div>

      {/* Continue button */}
      <div className="p-6 pt-0">
        <button
          onClick={onContinue}
          className="w-full bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

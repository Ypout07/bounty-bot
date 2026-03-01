import { supabase } from "./supabase";
import { Challenge, ProviderChallenge } from "./types";

// Map DB row (snake_case) → frontend type (camelCase)
function toChallenge(row: Record<string, unknown>): Challenge {
  return {
    id: row.id as string,
    title: row.title as string,
    company: row.company as string,
    description: row.description as string,
    request: (row.request as string) ?? "",
    postedAt: row.posted_at as string,
    startDate: row.start_date as string,
    deadline: row.deadline as string,
    status: row.status as Challenge["status"],
    submissionCount: (row.submission_count as number) ?? 0,
    repoUrl: (row.repo_url as string) ?? "",
  };
}

function toProviderChallenge(row: Record<string, unknown>): ProviderChallenge {
  return {
    ...toChallenge(row),
    metrics: (row.metrics as string[]) ?? [],
    repoUrl: (row.repo_url as string) ?? "",
    submissionCount: 0, // calculated separately if needed
  };
}

// Fetch all challenges (for participants)
export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("posted_at", { ascending: false });

  if (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }

  return (data ?? []).map(toChallenge);
}

// Fetch challenges created by a specific provider
export async function fetchProviderChallenges(company: string = "Creevo"): Promise<ProviderChallenge[]> {
  const query = supabase
    .from("challenges")
    .select("*")
    .eq("company", company)
    .order("posted_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching provider challenges:", error);
    return [];
  }

  return (data ?? []).map(toProviderChallenge);
}

// Create a new challenge (for providers)
export async function createChallenge(challenge: {
  title: string;
  company: string;
  description: string;
  request?: string;
  startDate?: string;
  deadline: string;
  metrics?: string[];
  repoUrl?: string;
}): Promise<ProviderChallenge | null> {
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      title: challenge.title,
      company: challenge.company,
      description: challenge.description,
      request: challenge.request ?? "",
      start_date: challenge.startDate ?? new Date().toISOString(),
      deadline: challenge.deadline,
      metrics: challenge.metrics ?? [],
      repo_url: challenge.repoUrl ?? "",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating challenge:", error.message, error.details, error.hint, error.code);
    return null;
  }

  return toProviderChallenge(data);
}

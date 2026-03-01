import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Look up the challenge that was just created by title to get its ID
    const { data: challenge, error: lookupError } = await supabase
      .from("challenges")
      .select("id")
      .eq("title", body.title)
      .order("posted_at", { ascending: false })
      .limit(1)
      .single();

    if (lookupError || !challenge) {
      console.error("Failed to find challenge:", lookupError);
      return NextResponse.json(
        { error: "Failed to find challenge" },
        { status: 500 },
      );
    }

    const newProblemId = challenge.id;

    console.log(`Seeding 24 mock competitors for problem: ${newProblemId}`);

    const mockSubmissions = Array.from({ length: 24 }).map((_, index) => ({
      problem_id: newProblemId,
      docker_image_tag: `mock/competitor-${index + 1}`,
      status: "pending",
      passed_tests: false,
      execution_time_seconds: 0.0,
      tokens_used: 0,
    }));

    const { error: seedError } = await supabase
      .from("submissions")
      .insert(mockSubmissions);

    if (seedError) {
      console.error("Failed to seed mock competitors:", seedError);
      return NextResponse.json(
        { error: "Failed to seed queue" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        challenge_id: newProblemId,
        message: "Challenge seeded with mock submissions!",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

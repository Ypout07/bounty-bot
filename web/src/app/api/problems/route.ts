import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // We insert the new competition and immediately .select() the ID it generated
    const { data: newCompetition, error: compError } = await supabase
      .from("competitions")
      .insert([
        {
          title: body.title,
          description: body.description,
        },
      ])
      .select("id")
      .single();

    if (compError || !newCompetition) {
      console.error("Failed to create competition:", compError);
      return NextResponse.json(
        { error: "Failed to create competition" },
        { status: 500 },
      );
    }

    const newProblemId = newCompetition.id;

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
        competition_id: newProblemId,
        message: "Competition created and seeded!",
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

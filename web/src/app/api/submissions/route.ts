import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problem_id, docker_image_tag } = body;

    if (!problem_id || !docker_image_tag) {
      return NextResponse.json(
        { error: "problem_id and docker_image_tag are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        problem_id,
        docker_image_tag,
        status: "pending",
        passed_tests: false,
        execution_time_seconds: 0.0,
        tokens_used: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create submission:", error);
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, submission_id: data.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fatal submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

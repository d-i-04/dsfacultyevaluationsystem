import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const {
      data: userData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const { assignmentId, periodId, overallComment, responses } = await request.json();

    if (!assignmentId || !responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the assignment exists and belongs to this evaluator
    const { data: assignment, error: assignmentError } = await supabase
      .from("evaluator_assignments")
      .select("id, period_id, faculty_id")
      .eq("id", assignmentId)
      .eq("evaluator_id", userId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found or you don't have permission" },
        { status: 403 }
      );
    }

    // Check if period is open
    const { data: period, error: periodError } = await supabase
      .from("evaluation_periods")
      .select("id, status")
      .eq("id", assignment.period_id)
      .maybeSingle();

    if (periodError || !period || period.status !== "open") {
      return NextResponse.json(
        { error: "Evaluation period is not open" },
        { status: 403 }
      );
    }

    // Check if evaluation already exists
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    let evaluationId = existingEval?.id;

    if (existingEval) {
      // Update existing evaluation
      const { error: updateError } = await supabase
        .from("evaluations")
        .update({
          overall_comment: overallComment,
          submitted_at: new Date().toISOString(),
          status: "submitted",
        })
        .eq("id", evaluationId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Delete old responses
      await supabase
        .from("evaluation_responses")
        .delete()
        .eq("evaluation_id", evaluationId);
    } else {
      // Create new evaluation
      const { data: newEval, error: createError } = await supabase
        .from("evaluations")
        .insert({
          assignment_id: assignmentId,
          overall_comment: overallComment,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError || !newEval) {
        return NextResponse.json(
          { error: createError?.message || "Failed to create evaluation" },
          { status: 500 }
        );
      }

      evaluationId = newEval.id;
    }

    // Insert evaluation responses
    const responseRecords = Object.entries(responses).map(([itemId, score]) => ({
      evaluation_id: evaluationId,
      rubric_item_id: itemId,
      score: Number(score),
    }));

    const { error: responsesError } = await supabase
      .from("evaluation_responses")
      .insert(responseRecords);

    if (responsesError) {
      return NextResponse.json(
        { error: responsesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, evaluationId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Evaluation submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

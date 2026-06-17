import { createClient } from "@supabase/supabase-js";

import { calculateSM2 } from "../utils/sm2";

type RevisionScheduleRow = {
  interval_days: number | null;
  ease_factor: number | string | null;
  repetitions: number | null;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function assertQuality(quality: number) {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new Error("quality must be an integer from 0 to 5");
  }
}

export async function getRevisionQueue(userId: string) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("revision_schedule")
    .select(
      `
      id,
      note_id,
      interval_days,
      ease_factor,
      repetitions,
      next_review_at,
      notes (
        id,
        material_id,
        content,
        created_at
      )
    `
    )
    .eq("user_id", userId)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    dueCount: data?.length ?? 0,
    queue: data ?? [],
  };
}

export async function markNoteReviewed(
  userId: string,
  noteId: string,
  quality: number
) {
  try {
    assertQuality(quality);

    const supabase = getSupabase();
    const { data: existing, error: lookupError } = await supabase
      .from("revision_schedule")
      .select("interval_days, ease_factor, repetitions")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .maybeSingle<RevisionScheduleRow>();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    const next = calculateSM2(
      quality,
      existing?.interval_days ?? 0,
      Number(existing?.ease_factor ?? 2.5),
      existing?.repetitions ?? 0
    );

    const reviewedAt = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("revision_schedule")
      .upsert(
        {
          user_id: userId,
          note_id: noteId,
          interval_days: next.intervalDays,
          ease_factor: next.easeFactor,
          repetitions: next.repetitions,
          last_reviewed_at: reviewedAt,
          next_review_at: next.nextReview.toISOString(),
          updated_at: reviewedAt,
        },
        { onConflict: "user_id,note_id" }
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return {
      success: true,
      schedule: {
        noteId,
        reviewedAt,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        repetitions: next.repetitions,
        nextReviewAt: next.nextReview.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RevisionQueueItem = {
  id: string;
  note_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  quality: number | null;
  next_review_at: string;
  last_reviewed_at: string | null;
  notes: {
    content: string;
  } | null;
};

export async function getRevisionQueue(userId: string) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("revision_schedule")
      .select(`
        id,
        note_id,
        interval_days,
        ease_factor,
        repetitions,
        quality,
        next_review_at,
        last_reviewed_at,
        notes (
          content
        )
      `)
      .eq("user_id", userId)
      .lte("next_review_at", now)
      .order("next_review_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function reviewNote(
  userId: string,
  noteId: string,
  quality: number
) {
  try {
    const { data: revision, error } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .single();

    if (error) throw error;

    let repetitions = revision.repetitions;
    let easeFactor = revision.ease_factor;
    let interval = revision.interval_days;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions++;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      easeFactor =
        easeFactor +
        (0.1 -
          (5 - quality) *
            (0.08 + (5 - quality) * 0.02));

      if (easeFactor < 1.3) {
        easeFactor = 1.3;
      }
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const { error: updateError } = await supabase
      .from("revision_schedule")
      .update({
        repetitions,
        ease_factor: easeFactor,
        interval_days: interval,
        quality,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReview.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", revision.id);

    if (updateError) throw updateError;

    return {
      success: true,
      data: {
        repetitions,
        easeFactor,
        interval,
        nextReviewAt: nextReview.toISOString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
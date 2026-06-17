export function calculateSM2(
  quality: number,
  intervalDays: number,
  easeFactor: number,
  repetitions: number
) {
  let newInterval = intervalDays;
  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(
        newInterval * newEaseFactor
      );
    }

    newRepetitions += 1;
  }

  newEaseFactor =
    newEaseFactor +
    (
      0.1 -
      (5 - quality) *
      (0.08 + (5 - quality) * 0.02)
    );

  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReview = new Date();

  nextReview.setDate(
    nextReview.getDate() + newInterval
  );

  return {
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReview,
  };
}
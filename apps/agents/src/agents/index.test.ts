import { expect, test } from "bun:test";

import { buildGoalSnapshot } from "./goalTrackerAgent";
import { helloWorld } from "./index";

test("helloWorld exports the Bun smoke test message", () => {
  expect(helloWorld).toBe("Hello from Bun agents!");
});

test("goal tracker flags a subject as behind when progress trails elapsed time", () => {
  const snapshot = buildGoalSnapshot(
    [
      {
        id: "task-1",
        status: "completed",
        subject_name: "Math",
        plan_id: "plan-1",
      },
      {
        id: "task-2",
        status: "pending",
        subject_name: "Math",
        plan_id: "plan-1",
      },
      {
        id: "task-3",
        status: "pending",
        subject_name: "Math",
        plan_id: "plan-1",
      },
      {
        id: "task-4",
        status: "pending",
        subject_name: "Math",
        plan_id: "plan-1",
      },
    ],
    [
      {
        id: "plan-1",
        subject: "Math",
        created_at: "2026-06-01T00:00:00.000Z",
        exam_date: "2026-06-21",
      },
    ]
  );

  expect(snapshot.subjects[0]?.completionPercentage).toBe(25);
  expect(snapshot.subjects[0]?.status).toBe("behind");
});

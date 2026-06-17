import { expect, test } from "bun:test";

import { buildGoalSnapshot } from "./goalTrackerAgent";
import { helloWorld } from "./index";
import { calculateSM2 } from "../utils/sm2";

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

test("goal tracker groups mock task data per subject", () => {
  const snapshot = buildGoalSnapshot(
    [
      {
        id: "task-1",
        status: "completed",
        subject_name: "Physics",
        plan_id: "plan-1",
      },
      {
        id: "task-2",
        status: "completed",
        subject_name: "Physics",
        plan_id: "plan-1",
      },
      {
        id: "task-3",
        status: "pending",
        subject_name: "Chemistry",
        plan_id: "plan-2",
      },
    ],
    [
      {
        id: "plan-1",
        subject: "Physics",
        created_at: "2026-06-01T00:00:00.000Z",
        exam_date: "2026-06-30",
      },
      {
        id: "plan-2",
        subject: "Chemistry",
        created_at: "2026-06-01T00:00:00.000Z",
        exam_date: "2026-06-30",
      },
    ]
  );

  expect(snapshot.overall.completedTasks).toBe(2);
  expect(snapshot.overall.totalTasks).toBe(3);
  expect(snapshot.subjects.find((subject) => subject.subject === "Physics")?.completionPercentage).toBe(100);
  expect(snapshot.subjects.find((subject) => subject.subject === "Chemistry")?.completionPercentage).toBe(0);
});

test("SM-2 mock review success advances first passing review to tomorrow", () => {
  const result = calculateSM2(5, 0, 2.5, 0);

  expect(result.intervalDays).toBe(1);
  expect(result.repetitions).toBe(1);
  expect(result.easeFactor).toBeGreaterThan(2.5);
});

test("SM-2 mock review failure resets repetitions and keeps a one day interval", () => {
  const result = calculateSM2(2, 10, 2.5, 4);

  expect(result.intervalDays).toBe(1);
  expect(result.repetitions).toBe(0);
  expect(result.easeFactor).toBeLessThan(2.5);
});

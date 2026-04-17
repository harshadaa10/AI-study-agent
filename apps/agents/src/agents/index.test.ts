import { expect, test } from "bun:test";

import { helloWorld } from "./index";

test("helloWorld exports the Bun smoke test message", () => {
  expect(helloWorld).toBe("Hello from Bun agents!");
});

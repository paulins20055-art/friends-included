import assert from "node:assert/strict";
import test from "node:test";
import { parseTelegramCommand } from "./telegram.ts";

test("Telegram parser preserves spaces inside transaction fields", () => {
  assert.deepEqual(
    parseTelegramCommand("/sale S01|Olivia Rose|A|One proud uncle and an emotional grandmother|1000|50|30|20"),
    {
      command: "/sale",
      raw: "S01|Olivia Rose|A|One proud uncle and an emotional grandmother|1000|50|30|20",
    },
  );
});

test("Telegram parser handles commands without arguments", () => {
  assert.deepEqual(parseTelegramCommand(" /start "), { command: "/start", raw: "" });
});

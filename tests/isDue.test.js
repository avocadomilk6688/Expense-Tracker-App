import { isDue } from "../scripts/recurringEngine.js";

describe("Recurring Schedule Engine", () => {

  test("new recurring item should be immediately due", () => {

    const rec = {
      frequency: "monthly",
      lastRun: null
    };

    expect(isDue(rec)).toBe(true);

  });

  test("daily recurring should become due after one day", () => {

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const rec = {
      frequency: "daily",
      lastRun: yesterday.toISOString()
    };

    expect(isDue(rec)).toBe(true);

  });

});
import {
  saveRecurring,
  getAllRecurring,
  deleteRecurring
} from "../scripts/recurringEngine.js";

const mockStorage = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
})();

global.localStorage = mockStorage;

describe("Recurring Expense CRUD", () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test("save recurring expense", () => {

    saveRecurring({
      id: 1,
      amount: 20,
      currency: "USD",
      tag: "Netflix",
      frequency: "monthly"
    });

    expect(getAllRecurring().length)
      .toBe(1);

  });

  test("delete recurring expense", () => {

    saveRecurring({
      id: 1,
      amount: 20,
      currency: "USD",
      tag: "Netflix",
      frequency: "monthly"
    });

    deleteRecurring(1);

    expect(getAllRecurring().length)
      .toBe(0);

  });

});
import {
  toBaseINR,
  fromBaseINR
} from "../scripts/currencyService.js";

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

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        rates: {
          USD: 1,
          INR: 80,
          MYR: 4,
        },
      }),
  })
);

describe("Multi-Currency Conversion Engine", () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test("USD -> INR", async () => {
    expect(await toBaseINR(10, "USD"))
      .toBe(800);
  });

  test("MYR -> INR", async () => {
    expect(await toBaseINR(4, "MYR"))
      .toBe(80);
  });

  test("INR -> USD", async () => {
    expect(await fromBaseINR(800, "USD"))
      .toBe(10);
  });

});
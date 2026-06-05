const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getAllowedMealsForDate,
  getMenuMutationError,
} = require("./menzaMenuRules");

test("radnim danima su dozvoljena sva tri obroka", () => {
  assert.deepEqual(getAllowedMealsForDate("2026-06-05"), [
    "dorucak",
    "rucak",
    "vecera",
  ]);
});

test("subotom nema vecere, a nedeljom je dozvoljen samo dorucak", () => {
  assert.deepEqual(getAllowedMealsForDate("2026-06-06"), [
    "dorucak",
    "rucak",
  ]);
  assert.deepEqual(getAllowedMealsForDate("2026-06-07"), ["dorucak"]);
});

test("odbija obrok koji nije dozvoljen za vikend", () => {
  assert.match(
    getMenuMutationError({
      datum: "2026-06-06",
      tipObroka: "vecera",
      now: new Date("2026-06-05T10:00:00Z"),
    }),
    /Subotom/
  );
});

test("zakljucava dorucak danas od 10:00 po vremenu u Podgorici", () => {
  assert.equal(
    getMenuMutationError({
      datum: "2026-06-05",
      tipObroka: "dorucak",
      now: new Date("2026-06-05T07:59:00Z"),
    }),
    null
  );

  assert.match(
    getMenuMutationError({
      datum: "2026-06-05",
      tipObroka: "dorucak",
      now: new Date("2026-06-05T08:00:00Z"),
    }),
    /završeno/
  );
});

test("odbija izmjenu menija za prosli datum", () => {
  assert.match(
    getMenuMutationError({
      datum: "2026-06-04",
      tipObroka: "rucak",
      now: new Date("2026-06-05T08:00:00Z"),
    }),
    /prošao/
  );
});

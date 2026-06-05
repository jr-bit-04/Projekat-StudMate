const MENZA_TIME_ZONE = "Europe/Podgorica";

const MEAL_RULES = {
  dorucak: { label: "Doručak", endMinutes: 10 * 60 },
  rucak: { label: "Ručak", endMinutes: 16 * 60 },
  vecera: { label: "Večera", endMinutes: 19 * 60 },
};

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getDayOfWeek(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getAllowedMealsForDate(dateString) {
  if (!isValidDateString(dateString)) return [];

  const dayOfWeek = getDayOfWeek(dateString);

  if (dayOfWeek === 0) return ["dorucak"];
  if (dayOfWeek === 6) return ["dorucak", "rucak"];
  return ["dorucak", "rucak", "vecera"];
}

function getLocalNowParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MENZA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function getMenuMutationError({ datum, tipObroka, now = new Date() }) {
  if (!isValidDateString(datum)) {
    return "Datum mora biti u formatu YYYY-MM-DD.";
  }

  const mealRule = MEAL_RULES[tipObroka];
  if (!mealRule) {
    return "Izabrani obrok nije validan.";
  }

  const allowedMeals = getAllowedMealsForDate(datum);
  if (!allowedMeals.includes(tipObroka)) {
    return getDayOfWeek(datum) === 0
      ? "Nedeljom je moguće dodati samo doručak."
      : "Subotom je moguće dodati samo doručak i ručak.";
  }

  const localNow = getLocalNowParts(now);

  if (datum < localNow.date) {
    return "Nije moguće dodavati ili mijenjati meni za datum koji je prošao.";
  }

  if (datum === localNow.date && localNow.minutes >= mealRule.endMinutes) {
    return `Vrijeme za ${mealRule.label.toLowerCase()} je završeno i meni se više ne može mijenjati.`;
  }

  return null;
}

module.exports = {
  MEAL_RULES,
  getAllowedMealsForDate,
  getLocalNowParts,
  getMenuMutationError,
  isValidDateString,
};

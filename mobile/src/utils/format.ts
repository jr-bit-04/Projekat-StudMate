import { SERVER_BASE_URL } from "../config/env";

export function formatDate(value?: string | null, fallback = "-") {
  if (!value) return fallback;

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(value?: string | null, fallback = "-") {
  if (!value) return fallback;

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null, fallback = "-") {
  if (!value) return fallback;

  return new Date(value).toLocaleString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(value?: number | string | null, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return `${numeric.toFixed(2)} EUR`;
}

export function normalizeUrl(value?: string | null) {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function absoluteAssetUrl(value?: string | null) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${SERVER_BASE_URL}${value}`;
  }

  return `${SERVER_BASE_URL}/${value}`;
}

export function isExpired(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function toLocalISO(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

export function getTodayISO() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toLocalISO(today);
}

export function getTomorrowISO() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return toLocalISO(tomorrow);
}

export function getMondayISO(baseDate = new Date()) {
  const monday = new Date(baseDate);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return toLocalISO(monday);
}

export function getWeekDays(baseDate = new Date()) {
  const monday = new Date(baseDate);
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);

  return [
    "Ponedjeljak",
    "Utorak",
    "Srijeda",
    "Četvrtak",
    "Petak",
    "Subota",
    "Nedjelja",
  ].map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      name,
      iso: toLocalISO(date),
    };
  });
}

export function getInitials(name?: string | null) {
  if (!name) return "SM";

  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "SM";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

export function reservationStatusLabel(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "pending") return "Čeka potvrdu";
  if (normalized === "active") return "Aktivna";
  if (normalized === "expired") return "Istekla";
  if (normalized === "completed") return "Završena";
  if (normalized === "cancelled") return "Otkazana";

  return status || "-";
}

export function reservationStatusTone(
  status?: string | null
): "danger" | "primary" | "success" | "warning" {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") return "success";
  if (normalized === "pending") return "warning";
  if (normalized === "completed") return "primary";
  if (normalized === "expired" || normalized === "cancelled") return "danger";

  return "primary";
}

export function mealLabel(type?: string | null) {
  if (type === "dorucak") return "Doručak";
  if (type === "rucak") return "Ručak";
  if (type === "vecera") return "Večera";
  return type || "Obrok";
}

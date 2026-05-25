import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const months = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

function Dom() {
  const [obligations, setObligations] = useState([]);
  const [obavjestenja, setObavjestenja] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Januar");
  const [showNotices, setShowNotices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    const fetchDom = async () => {
      try {
        const res = await api.get("/dom");

        setObligations(res.data.obligations || []);
        setObavjestenja(res.data.obavjestenja || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Greška pri učitavanju doma."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDom();
  }, []);

  const selectedObligation = useMemo(() => {
    return obligations.find(
      (item) =>
        normalizeMonth(item.mjesec) ===
        normalizeMonth(selectedMonth)
    );
  }, [obligations, selectedMonth]);

  if (loading) {
    return (
      <MainLayout>
        <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-4 md:p-6 lg:p-8 shadow-sm">
          <p className="font-medium text-slate-500">
            Učitavanje doma...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          STUDENTSKI DOM
        </p>

        <h1 className="mt-3 text-lg md:text-2xl lg:text-[34px] font-bold tracking-[-0.03em] text-[#10243A]">
          Mjesečne obaveze
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Klikni na mjesec i pogledaj status, iznos, uplatu i rok za plaćanje.
        </p>
      </section>

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle className="shrink-0" size={18} />
          {message}
        </div>
      )}

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-[#10243A]">
              Obavještenja doma
            </h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              Pregled najnovijih informacija vezanih za studentski dom.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowNotices(!showNotices)
            }
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] sm:w-auto"
          >
            {showNotices
              ? "Sakrij obavještenja"
              : "Prikaži obavještenja"}
          </button>
        </div>

        {showNotices && (
          <div className="mt-5 grid gap-3">
            {obavjestenja.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
                Trenutno nema obavještenja za dom.
              </div>
            ) : (
              obavjestenja.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.kategorija || "Dom"}
                    </span>

                    <span className="text-xs text-slate-400">
                      {formatDate(item.datum_vrijeme)}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#10243A]">
                    {item.naslov}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
        <InfoCard
          icon={Home}
          title="Studentski dom"
          value={user?.dorm || "Nije dodijeljen"}
        />

        <InfoCard
          icon={CalendarDays}
          title="Poslednje ažurirano"
          value={formatDateTime(
            selectedObligation?.updated_at
          )}
        />
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">
          Pregled po mjesecima
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Legend
            color="bg-red-500"
            text="Neplaćeno"
          />

          <Legend
            color="bg-green-500"
            text="Plaćeno"
          />

          <Legend
            color="bg-blue-500"
            text="Student ne boravi u domu"
          />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-6">
          {months.map((month) => {
            const obligation =
              obligations.find(
                (item) =>
                  normalizeMonth(item.mjesec) ===
                  normalizeMonth(month)
              );

            const status =
              obligation?.status || "default";

            const active =
              selectedMonth === month;

            return (
              <button
                key={month}
                type="button"
                onClick={() =>
                  setSelectedMonth(month)
                }
                className={`relative min-h-[96px] overflow-hidden rounded-[20px] border p-4 text-left font-bold transition hover:-translate-y-1 hover:shadow-md md:min-h-[115px] md:p-5 ${
                  getMonthCardClass(status)
                } ${
                  active
                    ? "ring-4 ring-[#0b3a8f]/15"
                    : ""
                }`}
              >
                <span className="relative z-10 break-words text-base md:text-lg">
                  {month}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">
          {selectedMonth}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Detalji obaveze za izabrani mjesec.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe4f0]">
          <DetailRow
            label="Period"
            value={getPeriod(selectedObligation)}
          />

          <DetailRow
            label="Status"
            value={formatStatus(
              selectedObligation?.status
            )}
          />

          <DetailRow
            label="Iznos"
            value={formatMoney(
              selectedObligation?.iznos
            )}
          />

          <DetailRow
            label="Uplaćeno"
            value={formatMoney(
              selectedObligation?.uplaceno
            )}
          />

          <DetailRow
            label="Datum uplate"
            value={formatDateTime(
              selectedObligation?.paid_at,
              "Nije plaćeno"
            )}
          />

          <DetailRow
            label="Rok za uplatu"
            value={formatDate(
              selectedObligation?.due_date
            )}
          />

          <DetailRow
            label="Poslednje ažurirano"
            value={formatDateTime(
              selectedObligation?.updated_at
            )}
          />
        </div>
      </section>
    </MainLayout>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
        <Icon size={24} />
      </div>

      <p className="text-sm font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-[#10243A] md:text-2xl">
        {value || "Nije dostupno"}
      </p>
    </div>
  );
}

function Legend({
  color,
  text,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4">
      <span
        className={`h-4 w-4 rounded-full ${color}`}
      />

      <span className="min-w-0 break-words font-semibold text-[#10243A]">
        {text}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex flex-col items-start gap-1 border-b border-[#dbe4f0] bg-white px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <span className="text-sm font-semibold text-slate-500">
        {label}
      </span>

      <strong className="break-words text-left text-sm font-bold text-[#10243A] sm:text-right">
        {value || "Nije dostupno"}
      </strong>
    </div>
  );
}

function normalizeMonth(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function getMonthCardClass(status = "") {
  const normalized = String(status).toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "placeno" ||
    normalized === "plaćeno"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    normalized === "inactive" ||
    normalized.includes("ne boravi")
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    normalized === "unpaid" ||
    normalized === "neplaceno" ||
    normalized === "neplaćeno"
  ) {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-[#dbe4f0] bg-[#F8FBFF] text-[#0b3a8f]";
}

function formatStatus(status) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (!status) return "Nije definisano";

  if (
    normalized === "paid" ||
    normalized === "placeno"
  ) {
    return "Plaćeno";
  }

  if (
    normalized === "unpaid" ||
    normalized === "neplaceno"
  ) {
    return "Neplaćeno";
  }

  if (normalized === "inactive") {
    return "Student ne boravi u domu";
  }

  return status;
}

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Nije dostupno";
  }

  return `${Number(value).toFixed(2)} €`;
}

function getPeriod(item) {
  if (!item) return "Nije dostupno";

  return `${item.mjesec || ""} ${
    item.godina || ""
  }`.trim();
}

function formatDate(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value,
  fallback = "Nije dostupno"
) {
  if (!value) return fallback;

  return new Date(value).toLocaleString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export default Dom;

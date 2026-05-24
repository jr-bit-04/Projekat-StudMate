import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Clock3,
  Coffee,
  Moon,
  Soup,
  Ticket,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const mealTimes = {
  dorucak: "07:00 - 09:00",
  rucak: "11:00 - 16:00",
  vecera: "17:00 - 20:00",
};

const meals = [
  { key: "dorucak", label: "Doručak", icon: Coffee },
  { key: "rucak", label: "Ručak", icon: Soup },
  { key: "vecera", label: "Večera", icon: Moon },
];

function Menza() {
  const [data, setData] = useState({
    meni: [],
    bonovi: {
      dorucak: 0,
      rucak: 0,
      vecera: 0,
    },
    obavjestenja: [],
  });

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedMeal, setSelectedMeal] = useState("dorucak");
  const [showNotices, setShowNotices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const weekStart = useMemo(() => getMondayISO(new Date()), []);

  useEffect(() => {
    const fetchMenza = async () => {
      try {
        const res = await api.get(`/menza?od=${weekStart}`);
        setData(res.data);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Greška pri učitavanju menze."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenza();
  }, [weekStart]);

  const weekDays = useMemo(() => getWeekDays(), []);

  const selectedMenu = data.meni.find(
    (item) =>
      item.datum?.slice(0, 10) === selectedDate &&
      item.tip_obroka === selectedMeal
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
          <p className="font-medium text-slate-500">
            Učitavanje menze...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          MENZA
        </p>

        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.03em] text-[#10243A]">
          Meni i studentski bonovi
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Univerzitet Crne Gore - Studentski servis
        </p>
      </section>

      {message && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle size={18} />
          {message}
        </div>
      )}

      <section className="mt-7 grid gap-5 md:grid-cols-3">
        {meals.map((meal) => {
          const Icon = meal.icon;

          return (
            <div
              key={meal.key}
              className="rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
                <Icon size={24} />
              </div>

              <h2 className="text-2xl font-bold text-[#10243A]">
                {meal.label}
              </h2>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Clock3 size={18} />
                {mealTimes[meal.key]}
              </div>

              <div className="mt-5 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0b3a8f]">
                  <Ticket size={18} />
                  Preostalo bonova
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0b3a8f] px-5 py-2 text-white">
                  <Ticket size={20} className="text-white" />

                  <span className="text-2xl font-bold">
                    {data.bonovi?.[meal.key] ?? 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#10243A]">
              Napomena
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Bonovi ističu 10-og u mjesecu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNotices(!showNotices)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-semibold text-white transition hover:bg-[#082d70]"
          >
            <Bell size={18} />

            {showNotices
              ? "Sakrij obavještenja"
              : "Prikaži obavještenja"}
          </button>
        </div>

        {showNotices && (
          <div className="mt-5 grid gap-3">
            {data.obavjestenja.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
                Trenutno nema obavještenja za menzu.
              </div>
            ) : (
              data.obavjestenja.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.kategorija || "Menza"}
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

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day) => {
            const isPast =
              new Date(day.iso) < startOfToday();

            const active = selectedDate === day.iso;

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDate(day.iso)}
                className={`rounded-[18px] border px-5 py-6 text-center transition ${
                  active
                    ? "border-[#0b3a8f] bg-[#0b3a8f] text-white"
                    : isPast
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-[#dbe4f0] bg-[#F8FBFF] text-[#10243A] hover:bg-white"
                }`}
              >
                <p className="text-lg font-bold">
                  {day.name}
                </p>

                <p className="mt-2 text-sm opacity-80">
                  {formatDate(day.iso)}
                </p>

                {day.iso === getTodayISO() && (
                  <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
                    Danas
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-7 inline-flex rounded-[18px] border border-[#dbe4f0] bg-[#F8FBFF] p-2">
          {meals.map((meal) => (
            <button
              key={meal.key}
              type="button"
              onClick={() => setSelectedMeal(meal.key)}
              className={`rounded-[14px] px-8 py-4 text-sm font-bold transition ${
                selectedMeal === meal.key
                  ? "bg-[#0b3a8f] text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {meal.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#dbe4f0] bg-white">
          <div className="border-b border-[#dbe4f0] bg-[#F8FBFF] px-7 py-7">
            <h2 className="text-2xl font-bold text-[#10243A]">
              {getMealLabel(selectedMeal)}
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              {formatDateLong(selectedDate)}
            </p>
          </div>

          {selectedMeal === "dorucak" ? (
            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-[#dbe4f0]">
                <div className="grid grid-cols-[1fr_180px] bg-[#F8FBFF]">
                  <div className="px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
                    SENDVIČI, PECIVA, KOLAČI
                  </div>

                  <div className="border-l border-[#dbe4f0] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
                    BONOVI / CIJENA
                  </div>
                </div>

                {(selectedMenu?.dorucak_stavke || []).length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-400">
                    Nema unosa za doručak.
                  </div>
                ) : (
                  selectedMenu.dorucak_stavke.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_180px] border-t border-[#dbe4f0]"
                      >
                        <div className="px-5 py-5 text-sm font-semibold text-[#10243A]">
                          {item.naziv}
                        </div>

                        <div className="flex items-center justify-center gap-2 border-l border-[#dbe4f0] px-5 py-5">
                          <div className="flex items-center gap-1 rounded-full bg-[#0b3a8f]/10 px-3 py-1">
                            <Ticket size={16} />

                            <span className="text-sm font-bold text-[#0b3a8f]">
                              {item.bonovi}
                            </span>
                          </div>

                          <span className="text-slate-300">
                            /
                          </span>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
                            {item.cijena || "1.20€"}
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4">
                <FoodColumn
                  title="GLAVNA JELA"
                  items={selectedMenu?.glavna_jela || []}
                />

                <FoodColumn
                  title="PRILOZI"
                  items={selectedMenu?.prilozi || []}
                />

                <FoodColumn
                  title="SALATE"
                  items={selectedMenu?.salate || []}
                />

                <FoodColumn
                  title="DODATNO"
                  items={selectedMenu?.dodatno || []}
                />
              </div>

              <div className="border-t border-[#dbe4f0] bg-[#F8FBFF] px-7 py-5 text-sm font-semibold text-slate-600">
                Glavno jelo + prilog + salata + dodatno = 1 bon.
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

function FoodColumn({ title, items }) {
  return (
    <div className="border-t border-[#dbe4f0] p-6 md:border-r md:border-t-0 last:border-r-0">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
        {title}
      </h3>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-[#F8FBFF] px-4 py-4 text-sm text-slate-400">
            Nema unosa
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4 text-sm font-semibold text-[#10243A]"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getWeekDays() {
  const today = startOfToday();
  const monday = new Date(today);

  const day = monday.getDay() || 7;

  monday.setDate(today.getDate() - day + 1);

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

function startOfToday() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

function getTodayISO() {
  return toLocalISO(startOfToday());
}

function getMondayISO(date) {
  const monday = new Date(date);

  const day = monday.getDay() || 7;

  monday.setDate(monday.getDate() - day + 1);

  monday.setHours(0, 0, 0, 0);

  return toLocalISO(monday);
}

function toLocalISO(date) {
  const copy = new Date(date);

  copy.setMinutes(
    copy.getMinutes() - copy.getTimezoneOffset()
  );

  return copy.toISOString().slice(0, 10);
}

function getMealLabel(key) {
  if (key === "dorucak") return "Doručak";
  if (key === "rucak") return "Ručak";

  return "Večera";
}

function formatDate(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }
  );
}

function formatDateLong(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }
  );
}

export default Menza;

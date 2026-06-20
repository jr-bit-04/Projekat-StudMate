import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  House,
  Percent,
  UtensilsCrossed,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function Dashboard() {
  const [data, setData] = useState({
    announcements: [],
    discounts: [],
    scholarships: [],
    menu: [],
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Greška pri učitavanju dashboard podataka."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-w-0 rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.96))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] md:p-6 lg:p-8">
          <p className="font-bold text-slate-500">Učitavanje podataka...</p>
        </div>
      </MainLayout>
    );
  }

  const heroStats = [
    {
      icon: AlertCircle,
      label: "Obavještenja",
      note: "objave i servisne informacije",
      value: formatCount(data.announcements.length),
      color: "bg-[#0b3a8f]/10 text-[#0b3a8f]",
      glow: "bg-[#0b3a8f]/14",
    },
    {
      icon: UtensilsCrossed,
      label: "Današnji obroci",
      note: "aktivni meni u menzi",
      value: formatCount(data.menu.length),
      color: "bg-emerald-50 text-emerald-700",
      glow: "bg-emerald-200/40",
    },
    {
      icon: Percent,
      label: "Popusti",
      note: "trenutno dostupne ponude",
      value: formatCount(data.discounts.length),
      color: "bg-amber-50 text-amber-700",
      glow: "bg-amber-200/50",
    },
    {
      icon: GraduationCap,
      label: "Stipendije",
      note: "otvoreni konkursi i krediti",
      value: formatCount(data.scholarships.length),
      color: "bg-rose-50 text-rose-700",
      glow: "bg-rose-200/40",
    },
  ];

  return (
    <MainLayout>
      <section className="relative isolate min-w-0 overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(246,250,255,0.98)_58%,rgba(235,243,255,0.96)_100%)] p-4 text-[#10243a] shadow-[0_24px_60px_rgba(15,23,42,0.10)] md:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0b3a8f]/18 to-transparent" />
        <div className="pointer-events-none absolute -left-12 top-0 h-40 w-40 rounded-full bg-[#0b3a8f]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-center">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#0b3a8f]">
              STUDMATE
            </p>

            <h1 className="max-w-3xl break-words text-2xl font-black leading-tight tracking-[-0.05em] md:text-3xl lg:text-[40px]">
              Sve studentske informacije organizovane na jednom mjestu.
            </h1>

            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-slate-500 md:text-[15px]">
              Pregled najnovijih obavještenja, menze, stipendija i studentskih
              pogodnosti iz baze, u življem i preglednijem svakodnevnom dashboardu.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {["Dom", "Menza", "Čitaonica", "Popusti"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-bold text-[#10243A] shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroStats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/84 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                >
                  <div
                    className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${item.glow}`}
                  />

                  <div
                    className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <p className="text-[28px] font-black tracking-[-0.04em] text-[#10243A]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#10243A]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          {message}
        </div>
      )}

      <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          icon={House}
          title="Dom"
          text="Obaveze i obavještenja doma"
          path="/dom"
          color="bg-[#0b3a8f]/10 text-[#0b3a8f]"
          glow="bg-[#0b3a8f]/12"
        />

        <ModuleCard
          icon={UtensilsCrossed}
          title="Menza"
          text="Meni i obroci"
          path="/menza"
          color="bg-emerald-50 text-emerald-700"
          glow="bg-emerald-200/40"
        />

        <ModuleCard
          icon={BookOpen}
          title="Čitaonica"
          text="Rezervacije mjesta"
          path="/citaona"
          color="bg-purple-50 text-purple-700"
          glow="bg-purple-200/40"
        />

        <ModuleCard
          icon={Percent}
          title="Popusti"
          text="Studentske pogodnosti"
          path="/popusti"
          color="bg-amber-50 text-amber-700"
          glow="bg-amber-200/45"
        />
      </section>

      <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.97))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
          <SectionTitle
            title="Najnovija obavještenja"
            subtitle="Podaci iz tabele obavještenja"
          />

          <div className="mt-5 grid gap-4 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.announcements.length === 0 ? (
              <Empty text="Trenutno nema obavještenja." />
            ) : (
              data.announcements.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#e7eef7] bg-white/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-black text-[#0b3a8f]">
                      {item.modul}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      {formatDate(item.datum_vrijeme)}
                    </span>
                  </div>

                  <h3 className="font-black text-[#10243a]">{item.naslov}</h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.97))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
          <SectionTitle
            title="Današnji meni"
            subtitle="Aktivni obroci"
          />

          <div className="mt-5 grid gap-3 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.menu.length === 0 ? (
              <Empty text="Trenutno nema aktivnog menija." />
            ) : (
              data.menu.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#e7eef7] bg-white/90 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                    {item.tip_obroka}
                  </p>

                  <h3 className="mt-1 font-black text-[#10243a]">
                    {item.naslov}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.97))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
          <SectionTitle
            title="Aktivni popusti"
            subtitle="Studentske pogodnosti"
          />

          <div className="mt-5 grid gap-4 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.discounts.length === 0 ? (
              <Empty text="Trenutno nema aktivnih popusta." />
            ) : (
              data.discounts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#e7eef7] bg-white/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words font-black text-[#10243a]">{item.naslov}</p>

                    <p className="mt-1 break-words text-sm text-slate-500">
                      {item.partner_naziv || "Partner nije unesen"}
                    </p>
                  </div>

                  <span className="self-start rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 sm:self-auto">
                    {item.vrijednost}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.97))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
          <SectionTitle
            title="Stipendije i krediti"
            subtitle="Aktivni konkursi"
          />

          <div className="mt-5 grid gap-4 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.scholarships.length === 0 ? (
              <Empty text="Trenutno nema aktivnih stipendija." />
            ) : (
              data.scholarships.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#e7eef7] bg-white/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-black text-[#10243a]">
                        {item.naslov}
                      </p>

                      <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                        {item.opis}
                      </p>
                    </div>

                    <GraduationCap className="text-rose-600" size={22} />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                    <CalendarDays size={17} />
                    Rok: {formatDate(item.rok)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function ModuleCard({ icon: Icon, title, text, path, color, glow }) {
  return (
    <Link
      to={path}
      className="group relative min-w-0 overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.96))] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl ${glow}`}
      />
      <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r from-[#0b3a8f] via-[#3b82f6] to-transparent opacity-85" />

      <div
        className={`relative mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${color}`}
      >
        <Icon size={26} />
      </div>

      <h3 className="relative break-words text-lg font-black text-[#10243a]">
        {title}
      </h3>

      <p className="relative mt-2 break-words text-sm leading-6 text-slate-500">
        {text}
      </p>

      <div className="relative mt-4 flex items-center gap-2 text-sm font-black text-[#0b3a8f]">
        Otvori
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="break-words text-xl font-black text-[#10243a] md:text-2xl">{title}</h2>
      <p className="mt-1 break-words text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e7eef7] bg-white/88 p-4 text-sm font-bold text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <AlertCircle className="shrink-0" size={18} />
      {text}
    </div>
  );
}

function formatCount(value) {
  return String(value).padStart(2, "0");
}

function formatDate(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default Dashboard;

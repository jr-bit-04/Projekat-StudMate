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
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-sm md:p-6 lg:p-8">
          <p className="font-bold text-slate-500">Učitavanje podataka...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="min-w-0 rounded-[32px] border border-slate-200 bg-white p-4 text-[#10243a] shadow-sm md:p-6 lg:p-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#0b3a8f]">
          STUDMATE
        </p>

        <h1 className="max-w-3xl break-words text-2xl font-black leading-tight tracking-[-0.05em] md:text-3xl lg:text-[38px]">
          Sve studentske informacije organizovane na jednom mjestu.
        </h1>

        <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-slate-500 md:text-[15px]">
          Pregled najnovijih obavještenja, menze, stipendija i studentskih
          pogodnosti iz baze.
        </p>
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
        />

        <ModuleCard
          icon={UtensilsCrossed}
          title="Menza"
          text="Meni i obroci"
          path="/menza"
          color="bg-emerald-50 text-emerald-700"
        />

        <ModuleCard
          icon={BookOpen}
          title="Čitaonica"
          text="Rezervacije mjesta"
          path="/citaona"
          color="bg-purple-50 text-purple-700"
        />

        <ModuleCard
          icon={Percent}
          title="Popusti"
          text="Studentske pogodnosti"
          path="/popusti"
          color="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
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
                  className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4"
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

        <div className="rounded-[30px] border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <SectionTitle
            title="Današnji meni"
            subtitle="Aktivni obroci"
          />

          <div className="mt-5 grid gap-3 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.menu.length === 0 ? (
              <Empty text="Trenutno nema aktivnog menija." />
            ) : (
              data.menu.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#f4f7fb] p-4">
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
        <div className="rounded-[30px] border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
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
                  className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] p-4 sm:flex-row sm:items-center sm:justify-between"
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

        <div className="rounded-[30px] border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <SectionTitle
            title="Stipendije i krediti"
            subtitle="Aktivni konkursi"
          />

          <div className="mt-5 grid gap-4 md:max-h-[400px] md:overflow-y-auto md:pr-1">
            {data.scholarships.length === 0 ? (
              <Empty text="Trenutno nema aktivnih stipendija." />
            ) : (
              data.scholarships.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#f8fafc] p-4">
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

function ModuleCard({ icon: Icon, title, text, path, color }) {
  return (
    <Link
      to={path}
      className="group min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${color}`}
      >
        <Icon size={26} />
      </div>

      <h3 className="break-words text-lg font-black text-[#10243a]">{title}</h3>

      <p className="mt-2 break-words text-sm leading-6 text-slate-500">{text}</p>

      <div className="mt-4 flex items-center gap-2 text-sm font-black text-[#0b3a8f]">
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
    <div className="flex items-start gap-3 rounded-2xl bg-[#f8fafc] p-4 text-sm font-bold text-slate-500">
      <AlertCircle className="shrink-0" size={18} />
      {text}
    </div>
  );
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

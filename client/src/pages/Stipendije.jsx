import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Search,
  CalendarDays,
  Building2,
  Banknote,
  ExternalLink,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function Stipendije() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [tip, setTip] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get("/stipendije");
    setItems(res.data.konkursi || []);
  };

  const filtered = useMemo(() => {
    let list = [...items];

    if (tip !== "all") {
      list = list.filter((item) => item.tip === tip);
    }

    if (search.trim()) {
      const value = search.toLowerCase();

      list = list.filter((item) =>
        [
          item.naslov,
          item.institucija,
          item.opis,
        ]
          .filter(Boolean)
          .some((f) =>
            String(f).toLowerCase().includes(value)
          )
      );
    }

    return list;
  }, [items, search, tip]);

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          STIPENDIJE I KREDITI
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Aktivni konkursi
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pregled aktivnih stipendija i studentskih kredita.
        </p>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga konkursa..."
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none"
            />
          </div>

          <select
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="h-12 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none"
          >
            <option value="all">Sve</option>
            <option value="stipendija">Stipendije</option>
            <option value="kredit">Krediti</option>
          </select>
        </div>
      </section>

      <section className="mt-7 grid gap-5">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
                  <GraduationCap size={24} />
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.tip}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold text-[#10243A]">
                    {item.naslov}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                    <Info icon={Building2} text={item.institucija} />
                    <Info icon={Banknote} text={item.iznos || "Nije navedeno"} />
                    <Info
                      icon={CalendarDays}
                      text={formatDate(item.rok)}
                    />
                  </div>
                </div>
              </div>

              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white"
                >
                  <ExternalLink size={16} />
                  Otvori konkurs
                </a>
              )}
            </div>
          </article>
        ))}
      </section>
    </MainLayout>
  );
}

function Info({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-[#0b3a8f]" />
      <span>{text}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default Stipendije;

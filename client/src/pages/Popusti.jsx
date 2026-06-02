import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  MapPin,
  Percent,
  Search,
  Store,
  Tag,
  X,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import PageHero from "../components/ui/PageHero";
import popustiHero from "../assets/sections/popusti.png";

function Popusti() {
  const [popusti, setPopusti] = useState([]);
  const [partneri, setPartneri] = useState([]);

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("expiry_asc");
  const [showExpired, setShowExpired] = useState(false);

  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPopusti();
  }, []);

  const fetchPopusti = async () => {
    try {
      const res = await api.get("/popusti");

      setPopusti(res.data.popusti || []);
      setPartneri(res.data.partneri || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri učitavanju popusta."
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    return [
      ...new Set(
        popusti
          .map((item) => item.kategorija)
          .filter(Boolean)
      ),
    ];
  }, [popusti]);

  const filteredPopusti = useMemo(() => {
    let list = [...popusti];

    if (!showExpired) {
      list = list.filter(
        (item) => !isExpired(item.valid_until)
      );
    }

    if (category !== "all") {
      list = list.filter(
        (item) => item.kategorija === category
      );
    }

    if (search.trim()) {
      const value = search.toLowerCase();

      list = list.filter((item) =>
        [
          item.naslov,
          item.opis,
          item.partner_naziv,
          item.kategorija,
          item.vrijednost,
          item.kod,
          item.lokacija,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field)
              .toLowerCase()
              .includes(value)
          )
      );
    }

    if (sort === "expiry_asc") {
      list.sort((a, b) => {
        if (!a.valid_until) return 1;
        if (!b.valid_until) return -1;

        return (
          new Date(a.valid_until) -
          new Date(b.valid_until)
        );
      });
    }

    if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );
    }

    return list;
  }, [
    popusti,
    category,
    search,
    sort,
    showExpired,
  ]);

  return (
    <MainLayout>
      <PageHero
        eyebrow="POPUSTI"
        title="Studentske pogodnosti i partneri"
        description="Pregled svih aktivnih studentskih popusta i partnerskih pogodnosti."
        image={popustiHero}
        imageAlt="Ilustracija studentskih popusta"
        theme="amber"
        imagePanelClassName="bg-[#0b2f6b]"
        highlights={[
          { icon: Percent, label: "Aktivne ponude" },
          { icon: Store, label: "Partnerska mreža" },
          { icon: Tag, label: "Brzi kodovi i uslovi" },
        ]}
      />

      <section className="mt-7 grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-7">
          <section className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
              <div className="w-full lg:w-[220px]">
                <label className="mb-2 block text-sm font-bold text-[#10243A]">
                  Kategorija
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
                >
                  <option value="all">
                    Sve kategorije
                  </option>

                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-0 flex-1">
                <label className="mb-2 block text-sm font-bold text-[#10243A]">
                  Pretraga
                </label>

                <Search
                  size={18}
                  className="absolute left-4 top-[52px] -translate-y-1/2 text-[#0b3a8f]"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Partner ili ključna riječ..."
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
                />
              </div>

              <div className="w-full lg:w-[180px]">
                <label className="mb-2 block text-sm font-bold text-[#10243A]">
                  Sortiranje
                </label>

                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
                >
                  <option value="expiry_asc">
                    Po isteku
                  </option>

                  <option value="newest">
                    Najnovije
                  </option>
                </select>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-[#10243A]">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) =>
                  setShowExpired(e.target.checked)
                }
                className="h-4 w-4"
              />

              Prikaži istekle ponude
            </label>
          </section>

          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
              <AlertCircle className="shrink-0" size={18} />
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                Učitavanje popusta...
              </p>
            </div>
          ) : filteredPopusti.length === 0 ? (
            <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                Nema pronađenih popusta.
              </p>
            </div>
          ) : (
            filteredPopusti.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className={`w-full min-w-0 rounded-[22px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md md:p-6 ${
                  isExpired(item.valid_until)
                    ? "border-red-200 opacity-70"
                    : "border-[#dbe4f0]"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3 md:gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
                      <Percent size={24} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-bold text-[#10243A] md:text-xl">
                          {item.naslov}
                        </h3>

                        {isExpired(item.valid_until) && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                            Isteklo
                          </span>
                        )}

                        {!item.valid_until && (
                          <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                            Trajna ponuda
                          </span>
                        )}
                      </div>

                      <p className="mt-2 break-words text-sm font-semibold text-[#0b3a8f]">
                        {item.partner_naziv}
                      </p>

                      <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-500">
                        {item.opis}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.kategorija && (
                          <Badge icon={Tag}>
                            {item.kategorija}
                          </Badge>
                        )}

                        {item.vrijednost && (
                          <Badge icon={Percent}>
                            {item.vrijednost}
                          </Badge>
                        )}

                        {item.lokacija && (
                          <Badge icon={MapPin}>
                            {item.lokacija}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="break-words rounded-2xl bg-[#F8FBFF] px-4 py-3 text-sm font-bold text-[#0b3a8f]">
                      {item.valid_until
                        ? `Važi do ${formatDate(
                            item.valid_until
                          )}`
                        : "Bez isteka"}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <div className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <Store className="text-[#0b3a8f]" />

              <h2 className="text-xl font-bold text-[#10243A]">
                Partneri
              </h2>
            </div>

	            <div className="mt-5 space-y-3">
	              {partneri.map((partner) => {
	                const website = normalizeUrl(partner.website);
	                const Wrapper = website ? "a" : "div";

	                return (
	                  <Wrapper
	                    key={partner.id}
	                    {...(website
	                      ? {
	                          href: website,
	                          target: "_blank",
	                          rel: "noreferrer",
	                        }
	                      : {})}
	                    className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 transition ${
	                      website
	                        ? "hover:bg-[#0b3a8f]/10"
	                        : "opacity-70"
	                    }`}
	                  >
	                    <div className="min-w-0">
	                      <p className="break-words font-bold text-[#10243A]">
	                        {partner.naziv}
	                      </p>

	                      {website ? (
	                        <p className="mt-1 break-all text-xs text-slate-400">
	                          {website}
	                        </p>
	                      ) : (
	                        <p className="mt-1 text-xs text-slate-400">
	                          Link nije dostupan
	                        </p>
	                      )}
	                    </div>

	                    {website && (
	                      <ExternalLink
	                        size={18}
	                        className="shrink-0 text-[#0b3a8f]"
	                      />
	                    )}
	                  </Wrapper>
	                );
	              })}
	            </div>
	          </div>
	        </aside>
	      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl md:rounded-[28px] md:p-8">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b3a8f]/10 text-[#0b3a8f] hover:bg-[#0b3a8f]/15"
            >
              <X size={18} />
            </button>

            <div className="flex flex-wrap gap-2">
              {selected.kategorija && (
                <Badge icon={Tag}>
                  {selected.kategorija}
                </Badge>
              )}

              {selected.vrijednost && (
                <Badge icon={Percent}>
                  {selected.vrijednost}
                </Badge>
              )}
            </div>

            <h2 className="mt-5 break-words text-2xl font-black tracking-[-0.03em] text-[#10243A] md:text-[34px]">
              {selected.naslov}
            </h2>

            <p className="mt-2 break-words text-base font-semibold text-[#0b3a8f] md:text-lg">
              {selected.partner_naziv}
            </p>

            <div className="mt-6 space-y-4">
              <InfoRow
                icon={CalendarDays}
                label="Period važenja"
                value={
                  selected.valid_until
                    ? `${formatDate(
                        selected.valid_from
                      )} - ${formatDate(
                        selected.valid_until
                      )}`
                    : "Trajna ponuda"
                }
              />

              {selected.lokacija && (
                <InfoRow
                  icon={MapPin}
                  label="Lokacija"
                  value={selected.lokacija}
                />
              )}

              {selected.kod && (
                <InfoRow
                  icon={Tag}
                  label="Kod popusta"
                  value={selected.kod}
                />
              )}
            </div>

            <div className="mt-8 rounded-2xl bg-[#F8FBFF] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
                Opis i uslovi korišćenja
              </p>

              <p className="mt-4 break-words text-[15px] leading-7 text-slate-600">
                {selected.opis}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#0b3a8f]/10 px-3 py-2 text-xs font-bold text-[#0b3a8f]">
      <Icon className="shrink-0" size={14} />
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-4 rounded-2xl border border-[#dbe4f0] bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#10243A]">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function isExpired(date) {
  if (!date) return false;

  return new Date(date) < new Date();
}

function normalizeUrl(value) {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default Popusti;

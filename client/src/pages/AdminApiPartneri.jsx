import { useEffect, useState } from "react";
import { Plus, Copy, Check, KeyRound, Store } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const inputClass =
  "h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]";

function AdminApiPartneri() {
  const [partneri, setPartneri] = useState([]);
  const [form, setForm] = useState({
    naziv: "",
    website: "",
    kontakt_email: "",
    logo_url: "",
  });
  const [newKey, setNewKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setError("");
      const res = await api.get("/popusti/moderacija/api-partner");
      setPartneri(res.data.partneri || []);
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri učitavanju partnera.");
    }
  };

  const createPartner = async (e) => {
    e.preventDefault();

    if (!form.naziv.trim()) {
      setError("Naziv partnera je obavezan.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const res = await api.post("/popusti/moderacija/api-partner", form);
      setNewKey(res.data.partner.api_key);
      setMessage("API partner je kreiran. Sačuvaj ključ ispod i pošalji ga partneru — prikazuje se ovako istaknuto samo sad.");
      setForm({ naziv: "", website: "", kontakt_email: "", logo_url: "" });
      fetchPartners();
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri kreiranju partnera.");
    }
  };

  const copy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  const change = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          POPUSTI
        </p>

        <h1 className="mt-3 text-2xl font-bold text-[#10243A] md:text-[34px]">
          API partneri
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kreiraj partnere koji preko API ključa automatski šalju promocije na
          moderaciju.
        </p>
      </section>

      {newKey && (
        <section className="mt-7 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <KeyRound size={18} />
            Novi API ključ
          </div>

          <p className="mt-2 text-sm text-emerald-700">
            Iskopiraj ga sada i pošalji partneru. Čuva se u listi ispod, ali ovo
            je jedini trenutak kad je ovako istaknut.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-[#10243A]">
              {newKey}
            </code>

            <button
              onClick={() => copy(newKey, "new")}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {copied === "new" ? <Check size={16} /> : <Copy size={16} />}
              {copied === "new" ? "Kopirano" : "Kopiraj"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#10243A]">
          <Store size={20} className="text-[#0b3a8f]" />
          Novi API partner
        </h2>

        <form onSubmit={createPartner} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Naziv partnera *">
            <input
              value={form.naziv}
              onChange={(e) => change("naziv", e.target.value)}
              placeholder="npr. Coffee House"
              className={inputClass}
            />
          </Field>

          <Field label="Kontakt email">
            <input
              type="email"
              value={form.kontakt_email}
              onChange={(e) => change("kontakt_email", e.target.value)}
              placeholder="kontakt@partner.me"
              className={inputClass}
            />
          </Field>

          <Field label="Website">
            <input
              value={form.website}
              onChange={(e) => change("website", e.target.value)}
              placeholder="https://partner.me"
              className={inputClass}
            />
          </Field>

          <Field label="Logo URL">
            <input
              value={form.logo_url}
              onChange={(e) => change("logo_url", e.target.value)}
              placeholder="https://.../logo.png"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]"
            >
              <Plus size={18} />
              Kreiraj partnera
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-bold text-[#10243A]">Postojeći API partneri</h2>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#dbe4f0]">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[1.4fr_1fr_2fr_110px] bg-[#F8FBFF]">
              <Head text="Partner" />
              <Head text="Status" />
              <Head text="API ključ" />
              <Head text="" />
            </div>

            {partneri.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Još nema API partnera.
              </div>
            ) : (
              partneri.map((partner) => (
                <div
                  key={partner.id}
                  className="grid grid-cols-[1.4fr_1fr_2fr_110px] border-t border-[#dbe4f0] bg-white"
                >
                  <Cell>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#10243A]">
                        {partner.naziv}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {partner.kontakt_email || partner.website || "-"}
                      </p>
                    </div>
                  </Cell>

                  <Cell>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        partner.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {partner.status}
                    </span>
                  </Cell>

                  <Cell>
                    <code className="block w-full truncate text-xs font-semibold text-slate-600">
                      {partner.api_key}
                    </code>
                  </Cell>

                  <Cell>
                    <button
                      onClick={() => copy(partner.api_key, partner.id)}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0b3a8f]/10 px-3 text-xs font-bold text-[#0b3a8f] hover:bg-[#0b3a8f]/20"
                    >
                      {copied === partner.id ? <Check size={14} /> : <Copy size={14} />}
                      {copied === partner.id ? "Ok" : "Kopiraj"}
                    </button>
                  </Cell>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10243A]">{label}</label>
      {children}
    </div>
  );
}

function Head({ text }) {
  return (
    <div className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
      {text}
    </div>
  );
}

function Cell({ children }) {
  return (
    <div className="flex min-w-0 items-center border-l border-[#dbe4f0] p-4 first:border-l-0">
      {children}
    </div>
  );
}

export default AdminApiPartneri;

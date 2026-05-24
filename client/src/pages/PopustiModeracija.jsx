import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function PopustiModeracija() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchModeration();
  }, []);

  const fetchModeration = async () => {
    try {
      const res = await api.get("/popusti/moderacija");
      setItems(res.data.popusti || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri učitavanju.");
    }
  };

  const approve = async (id) => {
    const res = await api.put(`/popusti/moderacija/${id}/approve`);
    setMessage(res.data.message);
    fetchModeration();
  };

  const reject = async (id) => {
    const res = await api.put(`/popusti/moderacija/${id}/reject`);
    setMessage(res.data.message);
    fetchModeration();
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          MODERACIJA
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Partnerske promocije
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Odobravanje i odbijanje popusta koje šalju partneri.
        </p>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
          {message}
        </div>
      )}

      <section className="mt-7 grid gap-5">
        {items.length === 0 ? (
          <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 text-sm text-slate-500 shadow-sm">
            Nema promocija.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.partner_naziv || "Nepoznat partner"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.source}
                    </span>

                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold text-[#10243A]">
                    {item.naslov}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <p><b>Kategorija:</b> {item.kategorija || "-"}</p>
                    <p><b>Popust:</b> {item.vrijednost || "-"}</p>
                    <p><b>Važi do:</b> {formatDate(item.valid_until)}</p>
                    <p><b>Kod:</b> {item.kod || "-"}</p>
                    <p><b>Lokacija:</b> {item.lokacija || "-"}</p>
                    <p><b>Email:</b> {item.kontakt_email || "-"}</p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => approve(item.id)}
                    disabled={item.status === "approved"}
                    className="flex h-11 items-center gap-2 rounded-2xl bg-green-600 px-4 text-sm font-bold text-white disabled:bg-slate-300"
                  >
                    <CheckCircle2 size={17} />
                    Odobri
                  </button>

                  <button
                    onClick={() => reject(item.id)}
                    disabled={item.status === "rejected"}
                    className="flex h-11 items-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white disabled:bg-slate-300"
                  >
                    <XCircle size={17} />
                    Odbij
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </MainLayout>
  );
}

function getStatusClass(status) {
  if (status === "approved") return "bg-green-50 text-green-700";
  if (status === "rejected") return "bg-red-50 text-red-600";
  return "bg-yellow-50 text-yellow-700";
}

function formatDate(value) {
  if (!value) return "Bez isteka";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default PopustiModeracija;

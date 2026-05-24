import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  KeyRound,
  Search,
  User,
  XCircle,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const durations = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2h", value: 120 },
  { label: "2h 30min", value: 150 },
  { label: "3h", value: 180 },
  { label: "3h 30min", value: 210 },
  { label: "4h", value: 240 },
  { label: "4h 30min", value: 270 },
  { label: "5h", value: 300 },
];

function AdminCitaona() {
  const [kod, setKod] = useState("");
  const [search, setSearch] = useState("");
  const [rezervacije, setRezervacije] = useState([]);

  const [datum, setDatum] = useState(getTodayISO());
  const [vrijemeOd, setVrijemeOd] = useState("07:00");
  const [trajanje, setTrajanje] = useState(60);
  const [vrijemeDo, setVrijemeDo] = useState("");
  const [mjesta, setMjesta] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [radi, setRadi] = useState(true);
  const [adminNote, setAdminNote] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const allowedDates = useMemo(() => [getTodayISO(), getTomorrowISO()], []);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    fetchSeats();
  }, [datum, vrijemeOd, trajanje]);

  const fetchReservations = async () => {
    try {
      const res = await api.get("/citaona/admin/rezervacije");
      setRezervacije(res.data.rezervacije || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri učitavanju rezervacija."
      );
    }
  };

  const fetchSeats = async () => {
    try {
      const res = await api.get(
        `/citaona?datum=${datum}&vrijeme_od=${vrijemeOd}&trajanje=${trajanje}`
      );

      setMjesta(res.data.mjesta || []);
      setVrijemeDo(res.data.vrijeme_do || "");
      setRadi(res.data.radi);
      setSelectedSeat(null);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri učitavanju mjesta."
      );
    }
  };

  const confirmCode = async () => {
    if (!kod.trim()) {
      setMessage("Unesi kod rezervacije.");
      return;
    }

    try {
      setMessage("");
      setSuccess("");

      const res = await api.post("/citaona/admin/potvrdi", {
        kod: kod.trim().toUpperCase(),
      });

      setSuccess(res.data.message);
      setKod("");
      fetchReservations();
      fetchSeats();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri potvrdi rezervacije."
      );
    }
  };

  const createAdminReservation = async () => {
    if (!selectedSeat) {
      setMessage("Izaberi slobodno mjesto.");
      return;
    }

    try {
      setMessage("");
      setSuccess("");

      const res = await api.post("/citaona/admin/rezervacija", {
        datum,
        vrijeme_od: vrijemeOd,
        trajanje,
        mjesto_id: selectedSeat,
        admin_note: adminNote || "Student bez prethodne rezervacije",
      });

      setSuccess(res.data.message);
      setAdminNote("");
      fetchReservations();
      fetchSeats();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri zauzimanju mjesta."
      );
    }
  };

  const filteredReservations = rezervacije.filter((item) => {
    const value = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(value) ||
      item.index_number?.toLowerCase().includes(value) ||
      item.kod?.toLowerCase().includes(value) ||
      item.admin_note?.toLowerCase().includes(value)
    );
  });

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN ČITAONICA
        </p>

        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.03em] text-[#10243A]">
          Upravljanje čitaonicom
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pregled mjesta, potvrda kodova i zauzimanje mjesta za studente bez rezervacije.
        </p>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <KeyRound className="text-[#0b3a8f]" />
          <h2 className="text-2xl font-bold text-[#10243A]">
            Potvrdi rezervaciju kodom
          </h2>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Student pokazuje kod pri ulasku u čitaonicu.
        </p>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="Unesi kod rezervacije"
            className="h-12 flex-1 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-bold uppercase tracking-[0.08em] outline-none focus:border-[#0b3a8f]"
          />

          <button
            type="button"
            onClick={confirmCode}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]"
          >
            <CheckCircle2 size={18} />
            Potvrdi
          </button>
        </div>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <DoorOpen className="text-[#0b3a8f]" />
          <h2 className="text-2xl font-bold text-[#10243A]">
            Pregled i zauzimanje mjesta
          </h2>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Izaberi datum i termin da vidiš slobodna i zauzeta mjesta.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Field label="Datum">
            <select
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            >
              {allowedDates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Vrijeme početka">
            <input
              type="time"
              value={vrijemeOd}
              onChange={(e) => setVrijemeOd(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </Field>

          <Field label="Trajanje">
            <select
              value={trajanje}
              onChange={(e) => setTrajanje(Number(e.target.value))}
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            >
              {durations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
          Izabrani termin: {vrijemeOd} - {vrijemeDo || "-"}
        </div>

        {!radi && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            <AlertCircle size={18} />
            Čitaonica ne radi u izabranom terminu.
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[26px] font-black tracking-[-0.03em] text-[#10243A]">
              Mjesta u čitaonici
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Plava mjesta su slobodna, crvena su zauzeta.
            </p>
          </div>

          <div className="flex gap-3 text-sm font-semibold">
            <span className="flex items-center gap-2 text-[#0b3a8f]">
              <span className="h-3 w-3 rounded-full bg-[#0b3a8f]" />
              Slobodno
            </span>

            <span className="flex items-center gap-2 text-red-600">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Zauzeto
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {mjesta.map((mjesto) => {
            const unavailable = mjesto.zauzeto || mjesto.status !== "active";
            const selected = selectedSeat === mjesto.id;

            return (
              <button
                key={mjesto.id}
                type="button"
                disabled={unavailable || !radi}
                onClick={() => setSelectedSeat(mjesto.id)}
                className={`relative flex h-[78px] w-[78px] items-center justify-center rounded-[22px] border text-lg font-black transition-all duration-200 ${
                  unavailable
                    ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"
                    : selected
                    ? "scale-105 border-[#0b3a8f] bg-[#0b3a8f] text-white shadow-[0_12px_25px_rgba(11,58,143,0.28)]"
                    : "border-[#d7e3f2] bg-[#0b3a8f]/10 text-[#0b3a8f] hover:scale-105 hover:bg-[#0b3a8f]/15"
                }`}
              >
                {mjesto.broj_mjesta}

                <span
                  className={`absolute bottom-2 h-2 w-2 rounded-full ${
                    unavailable ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Napomena / ime studenta bez rezervacije"
            className="h-12 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
          />

          <button
            type="button"
            disabled={!radi}
            onClick={createAdminReservation}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <User size={18} />
            Zauzmi mjesto
          </button>
        </div>
      </section>

      {message && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          <AlertCircle size={18} />
          {message}
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#10243A]">
              Rezervacije studenata
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pregled svih rezervacija u sistemu.
            </p>
          </div>

          <div className="relative w-full md:w-[340px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga po imenu, kodu ili napomeni..."
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-[#dbe4f0]">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr_1fr] bg-[#F8FBFF]">
            <Head text="Student/Napomena" />
            <Head text="Mjesto" />
            <Head text="Kod" />
            <Head text="Datum" />
            <Head text="Termin" />
            <Head text="Status" />
          </div>

          {filteredReservations.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Nema rezervacija.</div>
          ) : (
            filteredReservations.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr_1fr] border-t border-[#dbe4f0] bg-white"
              >
                <Cell>
                  <div>
                    <p className="font-bold text-[#10243A]">
                      {item.created_by_admin
                        ? item.admin_note || "Unos admina"
                        : item.name}
                    </p>

                    {!item.created_by_admin && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.index_number}
                      </p>
                    )}
                  </div>
                </Cell>

                <Cell>
                  <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                    {item.broj_mjesta}
                  </span>
                </Cell>

                <Cell>
                  <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] text-[#0b3a8f]">
                    {item.kod}
                  </span>
                </Cell>

                <Cell>{formatDate(item.datum)}</Cell>

                <Cell>
                  {item.vrijeme_od?.slice(0, 5)} -{" "}
                  {item.vrijeme_do?.slice(0, 5)}
                </Cell>

                <Cell>
                  <StatusBadge status={item.status} />
                </Cell>
              </div>
            ))
          )}
        </div>
      </section>
    </MainLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10243A]">
        {label}
      </label>
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
    <div className="flex items-center border-l border-[#dbe4f0] px-4 py-4 text-sm font-semibold text-[#10243A] first:border-l-0">
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
        <CheckCircle2 size={14} />
        Aktivna
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
        <Clock3 size={14} />
        Čeka dolazak
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
        <XCircle size={14} />
        Istekla
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        Otkazana
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
      {status || "-"}
    </div>
  );
}

function getTodayISO() {
  return toLocalISO(new Date());
}

function getTomorrowISO() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalISO(tomorrow);
}

function toLocalISO(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default AdminCitaona;

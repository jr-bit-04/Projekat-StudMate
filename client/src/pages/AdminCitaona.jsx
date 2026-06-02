import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Search,
  User,
  XCircle,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";

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

  const selectedSeatLabel = useMemo(
    () => mjesta.find((item) => item.id === selectedSeat)?.broj_mjesta ?? null,
    [mjesta, selectedSeat]
  );

  const filteredReservations = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return rezervacije;
    }

    return rezervacije.filter((item) => {
      return (
        item.name?.toLowerCase().includes(value) ||
        item.index_number?.toLowerCase().includes(value) ||
        item.kod?.toLowerCase().includes(value) ||
        item.admin_note?.toLowerCase().includes(value)
      );
    });
  }, [rezervacije, search]);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const res = await api.get("/citaona/admin/rezervacije");
        setRezervacije(res.data.rezervacije || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Greška pri učitavanju rezervacija."
        );
      }
    };

    loadReservations();
  }, []);

  useEffect(() => {
    const loadSeats = async () => {
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
          error.response?.data?.message || "Greška pri učitavanju mjesta."
        );
      }
    };

    loadSeats();
  }, [datum, vrijemeOd, trajanje]);

  const refreshReservations = async () => {
    try {
      const res = await api.get("/citaona/admin/rezervacije");
      setRezervacije(res.data.rezervacije || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri učitavanju rezervacija."
      );
    }
  };

  const refreshSeats = async () => {
    try {
      const res = await api.get(
        `/citaona?datum=${datum}&vrijeme_od=${vrijemeOd}&trajanje=${trajanje}`
      );

      setMjesta(res.data.mjesta || []);
      setVrijemeDo(res.data.vrijeme_do || "");
      setRadi(res.data.radi);
      setSelectedSeat(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri učitavanju mjesta.");
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
      refreshReservations();
      refreshSeats();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri potvrdi rezervacije."
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
      refreshReservations();
      refreshSeats();
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri zauzimanju mjesta.");
    }
  };

  return (
    <MainLayout>
      <section className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN ČITAONICA
        </p>

        <h1 className="mt-3 text-lg font-bold tracking-[-0.03em] text-[#10243A] md:text-2xl lg:text-[34px]">
          Upravljanje čitaonicom
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pregled mjesta, potvrda kodova i zauzimanje mjesta za studente bez
          rezervacije.
        </p>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <InfoMini
            icon={KeyRound}
            label="Potvrda koda"
            value="Provjera rezervacije pri ulasku"
          />
          <InfoMini
            icon={User}
            label="Admin unos"
            value="Zauzimanje mjesta bez rezervacije"
          />
          <InfoMini
            icon={CalendarDays}
            label="Pregled rezervacija"
            value="Pretraga svih unosa u sistemu"
          />
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
            <KeyRound size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
              Potvrdi rezervaciju kodom
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Student pokazuje kod pri ulasku u čitaonicu.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="Unesi kod rezervacije"
            className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-bold uppercase tracking-[0.08em] outline-none focus:border-[#0b3a8f]"
          />

          <button
            type="button"
            onClick={confirmCode}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white transition hover:bg-[#082d70] md:w-auto"
          >
            <CheckCircle2 size={18} />
            Potvrdi
          </button>
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
          Odaberi termin
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
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
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            <AlertCircle className="shrink-0" size={18} />
            Čitaonica ne radi u izabranom terminu.
          </div>
        )}
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-[-0.03em] text-[#10243A] md:text-[30px]">
              Pregled i zauzimanje mjesta
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-500 md:text-[15px]">
              Slobodna mjesta admin može odmah zauzeti za studenta bez prethodne
              rezervacije.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold">
            <span className="flex items-center gap-2 text-emerald-700">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Slobodno
            </span>

            <span className="flex items-center gap-2 text-red-600">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Zauzeto
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-6 md:mt-8 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10">
          {mjesta.map((mjesto) => {
            const unavailable = mjesto.zauzeto || mjesto.status !== "active";
            const selected = selectedSeat === mjesto.id;

            return (
              <button
                key={mjesto.id}
                type="button"
                disabled={unavailable || !radi}
                onClick={() => setSelectedSeat(mjesto.id)}
                className={`relative flex h-[58px] w-full items-center justify-center rounded-[14px] border text-base font-black transition-all duration-200 sm:h-[62px] md:h-[68px] md:rounded-[18px] md:text-lg ${
                  unavailable
                    ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"
                    : selected
                    ? "scale-105 border-emerald-600 bg-emerald-600 text-white shadow-[0_12px_25px_rgba(5,150,105,0.28)]"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-105 hover:bg-emerald-100"
                }`}
              >
                {mjesto.broj_mjesta}
              </button>
            );
          })}
        </div>

        <div className="mt-7 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4">
          <p className="text-sm font-bold text-[#10243A]">
            Admin unos bez prethodne rezervacije
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {selectedSeatLabel
              ? `Odabrano mjesto ${selectedSeatLabel}. Dodaj napomenu ili ime studenta.`
              : "Odaberi slobodno mjesto i dodaj napomenu ili ime studenta."}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <input
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Napomena / ime studenta bez rezervacije"
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-white px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />

            <button
              type="button"
              disabled={!radi}
              onClick={createAdminReservation}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            >
              <User size={18} />
              Zauzmi mjesto
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          <AlertCircle className="shrink-0" size={18} />
          {message}
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 className="shrink-0" size={18} />
          {success}
        </div>
      )}

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
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

        <div className="mt-6 grid gap-3 md:hidden">
          {filteredReservations.length === 0 ? (
            <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
              Nema rezervacija.
            </div>
          ) : (
            filteredReservations.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Student / napomena
                    </p>

                    <div className="mt-2">
                      <ReservationUser item={item} />
                    </div>
                  </div>

                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ReservationMeta label="Mjesto" value={item.broj_mjesta} />
                  <ReservationMeta label="Kod" value={item.kod} />
                  <ReservationMeta label="Datum" value={formatDate(item.datum)} />
                  <ReservationMeta
                    label="Termin"
                    value={`${item.vrijeme_od?.slice(0, 5)} - ${item.vrijeme_do?.slice(0, 5)}`}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-[#dbe4f0] md:block">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr_1fr] bg-[#F8FBFF]">
              <Head text="Student/Napomena" />
              <Head text="Mjesto" />
              <Head text="Kod" />
              <Head text="Datum" />
              <Head text="Termin" />
              <Head text="Status" />
            </div>

            {filteredReservations.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">Nema rezervacija.</div>
            ) : (
              filteredReservations.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr_1fr] border-t border-[#dbe4f0] bg-white"
                >
                  <Cell>
                    <ReservationUser item={item} compact />
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
                    {item.vrijeme_od?.slice(0, 5)} - {item.vrijeme_do?.slice(0, 5)}
                  </Cell>

                  <Cell>
                    <StatusBadge status={item.status} />
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

function InfoMini({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
        <Icon size={22} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-1 break-words text-base font-bold text-[#10243A] md:text-lg">
          {value}
        </p>
      </div>
    </div>
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
    <div className="flex min-w-0 items-center break-words border-l border-[#dbe4f0] px-4 py-4 text-sm font-semibold text-[#10243A] first:border-l-0">
      {children}
    </div>
  );
}

function ReservationUser({ item, compact = false }) {
  if (item.created_by_admin) {
    return (
      <div>
        <p className="font-bold text-[#10243A]">
          {item.admin_note || "Unos admina"}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 items-center gap-3 ${compact ? "" : "pr-2"}`}>
      <Avatar
        name={item.name}
        src={item.profile_image_url}
        size="sm"
      />

      <div className="min-w-0">
        <p className="truncate font-bold text-[#10243A]">
          {item.name || "-"}
        </p>

        {item.index_number && (
          <p className="mt-1 truncate text-xs text-slate-400">
            {item.index_number}
          </p>
        )}
      </div>
    </div>
  );
}

function ReservationMeta({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-[#10243A]">
        {value || "-"}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
        <CheckCircle2 size={14} />
        Aktivna
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
        <Clock3 size={14} />
        Čeka dolazak
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
        <XCircle size={14} />
        Istekla
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        Otkazana
      </div>
    );
  }

  return (
    <div className="inline-flex shrink-0 items-center rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
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

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Info,
  KeyRound,
  Trash2,
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

function Citaona() {
  const [datum, setDatum] = useState(getTodayISO());
  const [vrijemeOd, setVrijemeOd] = useState("07:00");
  const [trajanje, setTrajanje] = useState(60);
  const [mjesta, setMjesta] = useState([]);
  const [rezervacije, setRezervacije] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [vrijemeDo, setVrijemeDo] = useState("");
  const [radi, setRadi] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const allowedDates = useMemo(() => [getTodayISO(), getTomorrowISO()], []);

  useEffect(() => {
    fetchCitaona();
  }, [datum, vrijemeOd, trajanje]);

  const fetchCitaona = async () => {
    try {
      setMessage("");
      setSuccess("");

      const res = await api.get(
        `/citaona?datum=${datum}&vrijeme_od=${vrijemeOd}&trajanje=${trajanje}`
      );

      setMjesta(res.data.mjesta || []);
      setRezervacije(res.data.rezervacije || []);
      setVrijemeDo(res.data.vrijeme_do || "");
      setRadi(res.data.radi);
      setSelectedSeat(null);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri učitavanju čitaonice."
      );
    }
  };

  const reserveSeat = async () => {
    if (!selectedSeat) {
      setMessage("Prvo izaberi slobodno mjesto.");
      return;
    }

    try {
      setMessage("");
      setSuccess("");

      const res = await api.post("/citaona/rezervacija", {
        datum,
        vrijeme_od: vrijemeOd,
        trajanje,
        mjesto_id: selectedSeat,
      });

      setSuccess(`Rezervacija je uspješna. Tvoj kod je: ${res.data.rezervacija.kod}`);
      fetchCitaona();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri kreiranju rezervacije."
      );
    }
  };

  const cancelReservation = async (id) => {
    if (!window.confirm("Otkazati rezervaciju?")) return;

    try {
      await api.delete(`/citaona/rezervacija/${id}`);
      setSuccess("Rezervacija je otkazana.");
      fetchCitaona();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri otkazivanju rezervacije."
      );
    }
  };

  return (
    <MainLayout>
      <section className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ČITAONICA
        </p>

        <h1 className="mt-3 text-lg md:text-2xl lg:text-[34px] font-bold tracking-[-0.03em] text-[#10243A]">
          Centralna univerzitetska biblioteka
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Rezervacija mjesta u čitaonici za danas ili sjutra.
        </p>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <InfoMini icon={DoorOpen} label="Kapacitet" value="30 mjesta" />
          <InfoMini icon={Clock3} label="Radnim danima" value="07:00-21:00" />
          <InfoMini icon={CalendarDays} label="Vikend" value="Subota 07:00-15:00 - Nedjelja ne radi" />
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">Odaberi termin</h2>

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
            <h2 className="text-xl md:text-[30px] font-black tracking-[-0.03em] text-[#10243A]">
              Odaberi mjesto u čitaonici
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-500 md:text-[15px]">
              Slobodna mjesta mogu se rezervisati za izabrani termin.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold">
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
                    ? "scale-105 border-[#0b3a8f] bg-[#0b3a8f] text-white shadow-[0_12px_25px_rgba(0,59,115,0.28)]"
                    : "border-[#d7e3f2] bg-[#0b3a8f]/10 text-[#0b3a8f] hover:scale-105 hover:bg-[#0b3a8f]/15"
                }`}
              >
                {mjesto.broj_mjesta}

                <span
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full md:bottom-2 md:h-2 md:w-2 ${
                    unavailable ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

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

        <button
          type="button"
          onClick={reserveSeat}
          disabled={!radi}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          <KeyRound size={18} />
          Rezerviši mjesto
        </button>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4">
          <Info className="mt-1 shrink-0 text-[#0b3a8f]" size={20} />

          <p className="min-w-0 text-sm leading-6 text-slate-600">
            Kod rezervacije pokazuje se administratoru čitaonice na ulasku.
            Rezervacija ističe 15 minuta nakon početka termina ukoliko student
            ne dođe.
          </p>
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-2xl font-bold text-[#10243A]">Moje rezervacije</h2>

        <div className="mt-6 grid gap-3 md:hidden">
          {rezervacije.length === 0 ? (
            <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
              Nema rezervacija.
            </div>
          ) : (
            rezervacije.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Kod
                    </p>

                    <span className="mt-2 inline-flex rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-sm font-bold text-[#0b3a8f]">
                      {item.kod}
                    </span>
                  </div>

                  {item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => cancelReservation(item.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ReservationMeta label="Mjesto" value={item.broj_mjesta} />
                  <ReservationMeta label="Datum" value={formatDate(item.datum)} />
                  <ReservationMeta
                    label="Termin"
                    value={`${item.vrijeme_od?.slice(0, 5)} - ${item.vrijeme_do?.slice(0, 5)}`}
                  />
                  <ReservationMeta label="Status" value={formatStatus(item.status)} />
                  <ReservationMeta
                    label="Ističe"
                    value={formatDateTime(item.expires_at)}
                    wide
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-[#dbe4f0] md:block">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1.4fr_90px] bg-[#F8FBFF]">
              <Head text="Kod" />
              <Head text="Mjesto" />
              <Head text="Datum" />
              <Head text="Termin" />
              <Head text="Status" />
              <Head text="Ističe" />
              <Head text="" />
            </div>

            {rezervacije.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">Nema rezervacija.</div>
            ) : (
              rezervacije.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1.4fr_90px] border-t border-[#dbe4f0] bg-white"
                >
                  <Cell>
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 font-bold text-[#0b3a8f]">
                      {item.kod}
                    </span>
                  </Cell>

                  <Cell>{item.broj_mjesta}</Cell>
                  <Cell>{formatDate(item.datum)}</Cell>
                  <Cell>
                    {item.vrijeme_od?.slice(0, 5)} - {item.vrijeme_do?.slice(0, 5)}
                  </Cell>
                  <Cell>{formatStatus(item.status)}</Cell>
                  <Cell>{formatDateTime(item.expires_at)}</Cell>
                  <Cell>
                    {item.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => cancelReservation(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      "-"
                    )}
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
        <p className="mt-1 break-words text-base font-bold text-[#10243A] md:text-lg">{value}</p>
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

function ReservationMeta({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-[#10243A]">
        {value || "-"}
      </p>
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

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (status === "pending") return "Čeka dolazak";
  if (status === "active") return "Aktivna";
  if (status === "expired") return "Istekla";
  if (status === "cancelled") return "Otkazana";
  if (status === "completed") return "Završena";

  return status || "-";
}

export default Citaona;

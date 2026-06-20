import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Home,
  X,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ActionCtaCard from "../components/ui/ActionCtaCard";
import PageHero from "../components/ui/PageHero";
import useStoredUser from "../hooks/useStoredUser";
import domHero from "../assets/sections/dom.jpg";

const months = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

const initialPaymentForm = {
  months: [],
  cardNumber: "",
  cvv: "",
  expiryDate: "",
};

function Dom() {
  const [obligations, setObligations] = useState([]);
  const [obavjestenja, setObavjestenja] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [monthlyPrice, setMonthlyPrice] = useState(30);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [showNotices, setShowNotices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const user = useStoredUser();

  useEffect(() => {
    const fetchDom = async () => {
      try {
        const res = await api.get("/dom");

        const nextObligations = res.data.obligations || [];
        setObligations(nextObligations);
        const nextNotices = res.data.obavjestenja || [];
        setObavjestenja(nextNotices);
        setMonthlyPrice(Number(res.data?.monthlyPrice) || 30);
        setCurrentYear(
          Number(res.data?.currentYear) || new Date().getFullYear()
        );

        const apiLastUpdated = res.data.lastUpdated || null;
        if (apiLastUpdated) {
          setLastUpdated(apiLastUpdated);
        } else {
          const computedFromObligations = nextObligations.reduce(
            (latest, item) => {
              const value = item?.updated_at || item?.created_at;
              if (!value) return latest;

              const time = new Date(value).getTime();
              if (Number.isNaN(time)) return latest;

              if (!latest) return value;
              return time > new Date(latest).getTime() ? value : latest;
            },
            null
          );

          const computedFromNotices = nextNotices.reduce((latest, item) => {
            const value = item?.datum_vrijeme;
            if (!value) return latest;

            const time = new Date(value).getTime();
            if (Number.isNaN(time)) return latest;

            if (!latest) return value;
            return time > new Date(latest).getTime() ? value : latest;
          }, null);

          const candidates = [computedFromObligations, computedFromNotices].filter(
            Boolean
          );

          if (candidates.length) {
            const latest = candidates.reduce((a, b) =>
              new Date(a).getTime() >= new Date(b).getTime() ? a : b
            );
            setLastUpdated(latest);
          } else {
            setLastUpdated(new Date().toISOString());
          }
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Greška pri učitavanju doma."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDom();
  }, []);

  const selectedObligation = useMemo(() => {
    return obligations.find(
      (item) =>
        Number(item.godina) === Number(currentYear) &&
        normalizeMonth(item.mjesec) ===
        normalizeMonth(selectedMonth)
    );
  }, [currentYear, obligations, selectedMonth]);

  const monthlyObligations = useMemo(() => {
    return months.reduce((accumulator, month) => {
      const obligation = obligations.find(
        (item) =>
          Number(item.godina) === Number(currentYear) &&
          normalizeMonth(item.mjesec) === normalizeMonth(month)
      );

      accumulator[month] = obligation || null;
      return accumulator;
    }, {});
  }, [currentYear, obligations]);

  const totalPaymentAmount = paymentForm.months.length * monthlyPrice;

  const updatePaymentField = (field, value) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const togglePaymentMonth = (month) => {
    const obligation = monthlyObligations[month];
    const status = String(obligation?.status || "").toLowerCase();

    if (status === "paid" || status === "inactive") {
      return;
    }

    setPaymentForm((current) => ({
      ...current,
      months: current.months.includes(month)
        ? current.months.filter((item) => item !== month)
        : [...current.months, month],
    }));
  };

  const openPaymentModal = () => {
    setPaymentMessage("");
    setPaymentForm(initialPaymentForm);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setPaymentMessage("");
    setShowPaymentModal(false);
  };

  const validatePaymentForm = () => {
    if (paymentForm.months.length === 0) {
      return "Izaberi bar jedan mjesec za uplatu doma.";
    }

    if (paymentForm.cardNumber.length !== 12) {
      return "Broj kartice mora imati tačno 12 cifara.";
    }

    if (paymentForm.cvv.length !== 3) {
      return "CVV mora imati tačno 3 cifre.";
    }

    if (!isValidExpiryInput(paymentForm.expiryDate)) {
      return "Datum isteka unesi u formatu MM/YY.";
    }

    return "";
  };

  const handleDormPayment = async (event) => {
    event.preventDefault();

    const validationMessage = validatePaymentForm();

    if (validationMessage) {
      setPaymentMessage(validationMessage);
      return;
    }

    try {
      setIsPaying(true);
      setPaymentMessage("");

      const res = await api.post("/dom/placanje", {
        months: paymentForm.months,
        cardNumber: paymentForm.cardNumber,
        cvv: paymentForm.cvv,
        expiryDate: paymentForm.expiryDate,
      });

      setObligations(res.data?.obligations || []);
      setLastUpdated(res.data?.lastUpdated || new Date().toISOString());
      setMonthlyPrice(Number(res.data?.monthlyPrice) || monthlyPrice);
      setCurrentYear(Number(res.data?.currentYear) || currentYear);
      setSelectedMonth(res.data?.paidMonths?.[0] || selectedMonth);
      closePaymentModal();
    } catch (error) {
      const responseData = error.response?.data;

      if (
        error.response?.status === 409 &&
        Array.isArray(responseData?.conflictingMonths)
      ) {
        setPaymentForm((current) => ({
          ...current,
          months: current.months.filter(
            (month) => !responseData.conflictingMonths.includes(month)
          ),
        }));
      }

      setPaymentMessage(
        responseData?.message || "Greška pri simulaciji plaćanja doma."
      );
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-4 md:p-6 lg:p-8 shadow-sm">
          <p className="font-medium text-slate-500">
            Učitavanje doma...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHero
        eyebrow="STUDENTSKI DOM"
        title="Mjesečne obaveze"
        description="Klikni na mjesec i pogledaj status, iznos, uplatu i rok za plaćanje."
        image={domHero}
        imageAlt="Studentski dom"
        theme="blue"
        highlights={[
          { icon: Home, label: "Status smještaja" },
          { icon: CalendarDays, label: "Mjesečni pregled" },
          { icon: CalendarDays, label: formatDateTime(lastUpdated) },
        ]}
      />

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle className="shrink-0" size={18} />
          {message}
        </div>
      )}

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-[#10243A]">
              Obavještenja doma
            </h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              Pregled najnovijih informacija vezanih za studentski dom.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowNotices(!showNotices)
            }
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] sm:w-auto"
          >
            {showNotices
              ? "Sakrij obavještenja"
              : "Prikaži obavještenja"}
          </button>
        </div>

        {showNotices && (
          <div className="mt-5 grid gap-3">
            {obavjestenja.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
                Trenutno nema obavještenja za dom.
              </div>
            ) : (
              obavjestenja.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.kategorija || "Dom"}
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

      <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
        <InfoCard
          icon={Home}
          title="Studentski dom"
          value={user?.dorm || "Nije dodijeljen"}
        />

        <InfoCard
          icon={CalendarDays}
          title="Poslednje ažurirano"
          value={formatDateTime(lastUpdated)}
        />
      </section>

      {user?.role === "student" && (
        <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-[#10243A]">
                Plaćanje doma
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                Mjesečna cijena doma je fiksna i iznosi {formatMoney(monthlyPrice)}.
                Izaberi jedan ili više mjeseci za {currentYear}. Ukupan iznos se
                automatski računa u formi za uplatu.
              </p>
            </div>

            <ActionCtaCard
              chipLabel={`${formatMoney(monthlyPrice)} po mjesecu`}
              description={`Izaberi jedan ili više mjeseci za ${currentYear} i odmah otvori formu za kartično plaćanje.`}
              eyebrow="Plaćanje doma"
              icon={CreditCard}
              onClick={openPaymentModal}
              title="Plati dom"
            />
          </div>
        </section>
      )}

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">
          Pregled po mjesecima
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Legend
            color="bg-red-500"
            text="Neplaćeno"
          />

          <Legend
            color="bg-green-500"
            text="Plaćeno"
          />

          <Legend
            color="bg-blue-500"
            text="Student ne boravi u domu"
          />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-6">
          {months.map((month) => {
            const obligation = monthlyObligations[month];

            const status =
              obligation?.status || "default";

            const active =
              selectedMonth === month;

            return (
              <button
                key={month}
                type="button"
                onClick={() =>
                  setSelectedMonth(month)
                }
                className={`relative min-h-[96px] overflow-hidden rounded-[20px] border p-4 text-left font-bold transition hover:-translate-y-1 hover:shadow-md md:min-h-[115px] md:p-5 ${
                  getMonthCardClass(status)
                } ${
                  active
                    ? "ring-4 ring-[#0b3a8f]/15"
                    : ""
                }`}
              >
                <span className="relative z-10 break-words text-base md:text-lg">
                  {month}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">
          {selectedMonth} {currentYear}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Detalji obaveze za izabrani mjesec.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe4f0]">
          <DetailRow
            label="Period"
            value={getPeriod(selectedObligation)}
          />

          <DetailRow
            label="Status"
            value={formatStatus(
              selectedObligation?.status
            )}
          />

          <DetailRow
            label="Iznos"
            value={formatMoney(
              selectedObligation?.iznos
            )}
          />

          <DetailRow
            label="Uplaćeno"
            value={formatMoney(
              selectedObligation?.uplaceno
            )}
          />

          <DetailRow
            label="Datum uplate"
            value={formatDateTime(
              selectedObligation?.paid_at,
              "Nije plaćeno"
            )}
          />

          <DetailRow
            label="Rok za uplatu"
            value={formatDate(
              selectedObligation?.due_date
            )}
          />

          <DetailRow
            label="Poslednje ažurirano"
            value={formatDateTime(
              selectedObligation?.updated_at
            )}
          />
        </div>
      </section>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/55 p-3 sm:items-center">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#dbe4f0] bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0b3a8f]">
                  Online uplata
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#10243A]">
                  Plaćanje doma
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Izaberi mjesece koje želiš da platiš za {currentYear}. Cijena po
                  mjesecu je {formatMoney(monthlyPrice)}.
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] text-slate-500 transition hover:border-[#0b3a8f] hover:text-[#0b3a8f]"
              >
                <X size={20} />
              </button>
            </div>

            {paymentMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {paymentMessage}
              </div>
            )}

            <form
              className="mt-6 flex min-h-0 flex-1 flex-col"
              onSubmit={handleDormPayment}
            >
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Mjeseci za uplatu
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {months.map((month) => {
                      const obligation = monthlyObligations[month];
                      const status = String(obligation?.status || "").toLowerCase();
                      const selected = paymentForm.months.includes(month);
                      const isDisabled = status === "paid" || status === "inactive";

                      return (
                        <button
                          key={month}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => togglePaymentMonth(month)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            selected
                              ? "border-[#0b3a8f] bg-[#0b3a8f] text-white"
                              : isDisabled
                                ? "cursor-not-allowed border-[#dbe4f0] bg-[#F8FBFF] text-slate-400"
                                : "border-[#dbe4f0] bg-white text-[#10243A] hover:border-[#0b3a8f]"
                          }`}
                        >
                          <div className="text-sm font-bold">{month}</div>
                          <div className="mt-2 text-xs font-semibold">
                            {status === "paid"
                              ? "Već plaćeno"
                              : status === "inactive"
                                ? "Ne boravi"
                                : formatStatus(obligation?.status || "unpaid")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Ukupno za uplatu
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#10243A]">
                    {formatMoney(totalPaymentAmount)}
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  <InputField
                    label="Broj kartice"
                    placeholder="123456789012"
                    maxLength={12}
                    value={paymentForm.cardNumber}
                    onChange={(value) =>
                      updatePaymentField("cardNumber", normalizeDigitInput(value, 12))
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="CVV"
                      placeholder="123"
                      maxLength={3}
                      value={paymentForm.cvv}
                      onChange={(value) =>
                        updatePaymentField("cvv", normalizeDigitInput(value, 3))
                      }
                    />

                    <InputField
                      label="Datum isteka"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentForm.expiryDate}
                      onChange={(value) =>
                        updatePaymentField("expiryDate", normalizeExpiryInput(value))
                      }
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#dbe4f0] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-5 text-sm font-bold text-[#10243A] transition hover:border-[#0b3a8f]"
                >
                  Odustani
                </button>

                <button
                  type="submit"
                  disabled={isPaying}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CreditCard size={18} />
                  {isPaying ? "Plaćanje..." : "Plati dom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
        <Icon size={24} />
      </div>

      <p className="text-sm font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-[#10243A] md:text-2xl">
        {value || "Nije dostupno"}
      </p>
    </div>
  );
}

function Legend({
  color,
  text,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4">
      <span
        className={`h-4 w-4 rounded-full ${color}`}
      />

      <span className="min-w-0 break-words font-semibold text-[#10243A]">
        {text}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex flex-col items-start gap-1 border-b border-[#dbe4f0] bg-white px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <span className="text-sm font-semibold text-slate-500">
        {label}
      </span>

      <strong className="break-words text-left text-sm font-bold text-[#10243A] sm:text-right">
        {value || "Nije dostupno"}
      </strong>
    </div>
  );
}

function InputField({
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#10243A] outline-none transition focus:border-[#0b3a8f]"
      />
    </label>
  );
}

function normalizeMonth(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function normalizeDigitInput(value, maxLength) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeExpiryInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExpiryInput(value) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return false;
  }

  const [month, year] = value.split("/");
  const expiry = new Date(2000 + Number(year), Number(month), 0, 23, 59, 59, 999);

  return expiry >= new Date();
}

function getMonthCardClass(status = "") {
  const normalized = String(status).toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "placeno" ||
    normalized === "plaćeno"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    normalized === "inactive" ||
    normalized.includes("ne boravi")
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    normalized === "unpaid" ||
    normalized === "neplaceno" ||
    normalized === "neplaćeno"
  ) {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-[#dbe4f0] bg-[#F8FBFF] text-[#0b3a8f]";
}

function formatStatus(status) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (!status) return "Nije definisano";

  if (
    normalized === "paid" ||
    normalized === "placeno"
  ) {
    return "Plaćeno";
  }

  if (
    normalized === "unpaid" ||
    normalized === "neplaceno"
  ) {
    return "Neplaćeno";
  }

  if (normalized === "inactive") {
    return "Student ne boravi u domu";
  }

  return status;
}

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Nije dostupno";
  }

  return `${Number(value).toFixed(2)} €`;
}

function getPeriod(item) {
  if (!item) return "Nije dostupno";

  return `${item.mjesec || ""} ${
    item.godina || ""
  }`.trim();
}

function formatDate(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value,
  fallback = "Nije dostupno"
) {
  if (!value) return fallback;

  return new Date(value).toLocaleString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export default Dom;

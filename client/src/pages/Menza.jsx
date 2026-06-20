import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Clock3,
  Coffee,
  CreditCard,
  Moon,
  Soup,
  Ticket,
  X,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ActionCtaCard from "../components/ui/ActionCtaCard";
import PageHero from "../components/ui/PageHero";
import useStoredUser from "../hooks/useStoredUser";
import menzaHero from "../assets/sections/menza.jpg";

const mealTimes = {
  dorucak: "08:00 - 10:00",
  rucak: "11:00 - 16:00",
  vecera: "17:00 - 19:00",
};

const meals = [
  { key: "dorucak", label: "Doručak", icon: Coffee },
  { key: "rucak", label: "Ručak", icon: Soup },
  { key: "vecera", label: "Večera", icon: Moon },
];

const emptyBonovi = {
  dorucak: 0,
  rucak: 0,
  vecera: 0,
  updated_at: null,
};

const initialPurchaseForm = {
  dorucak: "",
  rucak: "",
  vecera: "",
  cardNumber: "",
  cvv: "",
  expiryDate: "",
};

function getDefaultProdaja() {
  return {
    mjesec: null,
    limit_po_obroku: 500,
    prodato: {
      dorucak: 0,
      rucak: 0,
      vecera: 0,
    },
    preostalo: {
      dorucak: 500,
      rucak: 500,
      vecera: 500,
    },
  };
}

function Menza() {
  const user = useStoredUser();
  const [data, setData] = useState({
    meni: [],
    bonovi: emptyBonovi,
    obavjestenja: [],
    prodaja: getDefaultProdaja(),
  });
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedMeal, setSelectedMeal] = useState("dorucak");
  const [showNotices, setShowNotices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("danger");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const weekStart = useMemo(() => getMondayISO(new Date()), []);

  const fetchMenza = useCallback(async () => {
    try {
      const res = await api.get(`/menza?od=${weekStart}`);
      setData({
        meni: res.data?.meni || [],
        bonovi: res.data?.bonovi || emptyBonovi,
        obavjestenja: res.data?.obavjestenja || [],
        prodaja: res.data?.prodaja || getDefaultProdaja(),
      });
    } catch (error) {
      setMessageTone("danger");
      setMessage(
        error.response?.data?.message || "Greška pri učitavanju menze."
      );
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchMenza();
  }, [fetchMenza]);

  const weekDays = useMemo(() => getWeekDays(), []);

  const selectedMenu = data.meni.find(
    (item) =>
      item.datum?.slice(0, 10) === selectedDate &&
      item.tip_obroka === selectedMeal
  );

  const breakfastItems = normalizeBreakfastItems(
    selectedMenu?.dorucak_stavke || []
  );
  const totalVoucherCount =
    Number(purchaseForm.dorucak || 0) +
    Number(purchaseForm.rucak || 0) +
    Number(purchaseForm.vecera || 0);

  const openPurchaseModal = () => {
    setPurchaseMessage("");
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setPurchaseMessage("");
    setShowPurchaseModal(false);
  };

  const updatePurchaseField = (field, value) => {
    setPurchaseForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validatePurchaseForm = () => {
    const counts = ["dorucak", "rucak", "vecera"].map((field) =>
      parseVoucherValue(purchaseForm[field])
    );

    if (counts.some((value) => value === null)) {
      return "Broj bonova mora biti cio broj jednak ili veći od nule.";
    }

    if (counts.reduce((sum, value) => sum + value, 0) === 0) {
      return "Unesi broj bonova za bar jedan obrok.";
    }

    if (purchaseForm.cardNumber.length !== 12) {
      return "Broj kartice mora imati tačno 12 cifara.";
    }

    if (purchaseForm.cvv.length !== 3) {
      return "CVV mora imati tačno 3 cifre.";
    }

    if (!isValidExpiryInput(purchaseForm.expiryDate)) {
      return "Datum isteka unesi u formatu MM/YY.";
    }

    return "";
  };

  const applyAllowedPurchase = (allowedPurchase) => {
    setPurchaseForm((current) => ({
      ...current,
      dorucak: stringifySuggestedCount(allowedPurchase?.dorucak),
      rucak: stringifySuggestedCount(allowedPurchase?.rucak),
      vecera: stringifySuggestedCount(allowedPurchase?.vecera),
    }));
  };

  const handlePurchase = async (event) => {
    event.preventDefault();

    const validationMessage = validatePurchaseForm();

    if (validationMessage) {
      setPurchaseMessage(validationMessage);
      return;
    }

    try {
      setIsPurchasing(true);
      setPurchaseMessage("");

      const res = await api.post("/menza/bonovi/kupovina", {
        dorucak: Number(purchaseForm.dorucak || 0),
        rucak: Number(purchaseForm.rucak || 0),
        vecera: Number(purchaseForm.vecera || 0),
        cardNumber: purchaseForm.cardNumber,
        cvv: purchaseForm.cvv,
        expiryDate: purchaseForm.expiryDate,
      });

      setData((current) => ({
        ...current,
        bonovi: res.data?.bonovi || current.bonovi,
        prodaja: res.data?.prodaja || current.prodaja,
      }));
      setPurchaseForm(initialPurchaseForm);
      setMessage("");
      closePurchaseModal();
    } catch (error) {
      const responseData = error.response?.data;

      if (error.response?.status === 409 && responseData?.allowedPurchase) {
        applyAllowedPurchase(responseData.allowedPurchase);
      }

      if (responseData?.prodaja) {
        setData((current) => ({
          ...current,
          prodaja: responseData.prodaja,
        }));
      }

      setPurchaseMessage(
        responseData?.message || "Greška pri simulaciji kupovine bonova."
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
          <p className="font-medium text-slate-500">Učitavanje menze...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHero
        eyebrow="MENZA"
        title="Meni i studentski bonovi"
        description="Univerzitet Crne Gore - Studentski servis"
        image={menzaHero}
        imageAlt="Studenti u menzi"
        theme="emerald"
        featuredHighlight={{ icon: Soup, label: "Obroci" }}
        highlights={[
          { icon: Coffee, label: "Doručak" },
          { icon: Soup, label: "Ručak i večera" },
          { icon: Ticket, label: "Bonovi uživo" },
        ]}
      />

      {message && <MessageBanner tone={messageTone}>{message}</MessageBanner>}

      <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        {meals.map((meal) => {
          const Icon = meal.icon;

          return (
            <div
              key={meal.key}
              className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
                <Icon size={24} />
              </div>

              <h2 className="break-words text-2xl font-bold text-[#10243A]">
                {meal.label}
              </h2>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Clock3 size={18} />
                {mealTimes[meal.key]}
              </div>

              <div className="mt-5 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0b3a8f]">
                  <Ticket size={18} />
                  Preostalo bonova
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0b3a8f] px-5 py-2 text-white">
                  <Ticket size={20} className="text-white" />

                  <span className="text-2xl font-bold">
                    {data.bonovi?.[meal.key] ?? 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-[#10243A]">Napomena</h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              Bonovi ističu 10-og u mjesecu. Posljednje ažuriranje:{" "}
              {formatDateTime(data.bonovi?.updated_at)}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {user?.role === "student" ? (
              <ActionCtaCard
                chipLabel="Otvori uplatu"
                description="Otvori formu za doručak, ručak i večeru i odmah dopuni stanje svog naloga."
                eyebrow="Kupovina bonova"
                icon={CreditCard}
                onClick={openPurchaseModal}
                title="Kupi bonove"
              />
            ) : null}

            <button
              type="button"
              onClick={() => setShowNotices(!showNotices)}
              className="inline-flex h-[60px] w-full items-center justify-center gap-2 rounded-[22px] border border-[#dbe4f0] bg-[#F8FBFF] px-5 text-sm font-semibold text-[#0b3a8f] transition hover:border-[#c8d7eb] hover:bg-white sm:min-w-[220px] sm:w-auto"
            >
              <Bell size={18} />

              {showNotices ? "Sakrij obavještenja" : "Prikaži obavještenja"}
            </button>
          </div>
        </div>

        {showNotices && (
          <div className="mt-5 grid gap-3">
            {data.obavjestenja.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4 text-sm text-slate-500">
                Trenutno nema obavještenja za menzu.
              </div>
            ) : (
              data.obavjestenja.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                      {item.kategorija || "Menza"}
                    </span>

                    <span className="text-xs text-slate-400">
                      {formatDate(item.datum_vrijeme)}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#10243A]">{item.naslov}</h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.opis}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 xl:grid-cols-7">
          {weekDays.map((day) => {
            const isPast = new Date(day.iso) < startOfToday();
            const active = selectedDate === day.iso;

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDate(day.iso)}
                className={`rounded-[18px] border px-2 py-4 text-center transition md:px-5 md:py-6 ${
                  active
                    ? "border-[#0b3a8f] bg-[#0b3a8f] text-white"
                    : isPast
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-[#dbe4f0] bg-[#F8FBFF] text-[#10243A] hover:bg-white"
                }`}
              >
                <p className="break-words text-sm font-bold md:text-lg">
                  {day.name}
                </p>

                <p className="mt-2 text-xs opacity-80 md:text-sm">
                  {formatDate(day.iso)}
                </p>

                {day.iso === getTodayISO() && (
                  <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
                    Danas
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid w-full grid-cols-3 gap-1 rounded-[18px] border border-[#dbe4f0] bg-[#F8FBFF] p-1 sm:inline-grid sm:w-auto sm:p-2">
          {meals.map((meal) => (
            <button
              key={meal.key}
              type="button"
              onClick={() => setSelectedMeal(meal.key)}
              className={`rounded-[14px] px-2 py-3 text-xs font-bold transition sm:px-8 sm:py-4 sm:text-sm ${
                selectedMeal === meal.key
                  ? "bg-[#0b3a8f] text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {meal.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#dbe4f0] bg-white">
          <div className="border-b border-[#dbe4f0] bg-[#F8FBFF] px-4 py-5 md:px-7 md:py-7">
            <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
              {getMealLabel(selectedMeal)}
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              {formatDateLong(selectedDate)}
            </p>
          </div>

          {selectedMeal === "dorucak" ? (
            <div className="p-4 md:p-6">
              <div className="overflow-hidden rounded-2xl border border-[#dbe4f0]">
                <div className="grid grid-cols-1 bg-[#F8FBFF] md:grid-cols-[1fr_180px]">
                  <div className="px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
                    SENDVIČI, PECIVA, KOLAČI
                  </div>

                  <div className="hidden border-l border-[#dbe4f0] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f] md:block">
                    BONOVI / CIJENA
                  </div>
                </div>

                {breakfastItems.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-400">
                    Nema unosa za doručak.
                  </div>
                ) : (
                  breakfastItems.map((item, index) => (
                    <div
                      key={`${item.naziv}-${index}`}
                      className="grid grid-cols-1 border-t border-[#dbe4f0] md:grid-cols-[1fr_180px]"
                    >
                      <div className="break-words px-4 py-4 text-sm font-semibold text-[#10243A] md:px-5 md:py-5">
                        {item.naziv}
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 border-t border-[#dbe4f0] px-4 py-4 md:justify-center md:border-l md:border-t-0 md:px-5 md:py-5">
                        <div className="flex items-center gap-1 rounded-full bg-[#0b3a8f]/10 px-3 py-1">
                          <Ticket size={16} />

                          <span className="text-sm font-bold text-[#0b3a8f]">
                            {item.bonovi || 1}
                          </span>
                        </div>

                        <span className="text-slate-300">/</span>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
                          {item.cijena || "1.20€"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4">
                <FoodColumn
                  title="GLAVNA JELA"
                  items={selectedMenu?.glavna_jela || []}
                />

                <FoodColumn
                  title="PRILOZI"
                  items={selectedMenu?.prilozi || []}
                />

                <FoodColumn
                  title="SALATE"
                  items={selectedMenu?.salate || []}
                />

                <FoodColumn
                  title="DODATNO"
                  items={selectedMenu?.dodatno || []}
                />
              </div>

              <div className="border-t border-[#dbe4f0] bg-[#F8FBFF] px-4 py-5 text-sm font-semibold text-slate-600 md:px-7">
                Glavno jelo + prilog + salata + dodatno = 1 bon.
              </div>
            </>
          )}
        </div>
      </section>

      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/55 p-3 sm:items-center">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#dbe4f0] bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0b3a8f]">
                  Online uplata
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#10243A]">
                  Kupovina bonova
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Unesi broj bonova po obroku i validne podatke kartice da
                  simuliraš kupovinu bonova.
                </p>
              </div>

              <button
                type="button"
                onClick={closePurchaseModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] text-slate-500 transition hover:border-[#0b3a8f] hover:text-[#0b3a8f]"
              >
                <X size={20} />
              </button>
            </div>

            {purchaseMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {purchaseMessage}
              </div>
            )}

            <form
              className="mt-6 flex min-h-0 flex-1 flex-col"
              onSubmit={handlePurchase}
            >
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Bonovi za uplatu
                  </p>

                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    {meals.map((meal) => (
                      <CountInput
                        key={meal.key}
                        label={meal.label}
                        value={purchaseForm[meal.key]}
                        onChange={(value) =>
                          updatePurchaseField(meal.key, normalizeCountInput(value))
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Ukupno bonova
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#10243A]">
                    {totalVoucherCount}
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  <InputField
                    label="Broj kartice (12 cifara)"
                    placeholder="123456789012"
                    maxLength={12}
                    value={purchaseForm.cardNumber}
                    onChange={(value) =>
                      updatePurchaseField("cardNumber", normalizeDigitInput(value, 12))
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="CVV"
                      placeholder="123"
                      maxLength={3}
                      value={purchaseForm.cvv}
                      onChange={(value) =>
                        updatePurchaseField("cvv", normalizeDigitInput(value, 3))
                      }
                    />

                    <InputField
                      label="Datum isteka"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={purchaseForm.expiryDate}
                      onChange={(value) =>
                        updatePurchaseField("expiryDate", normalizeExpiryInput(value))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#dbe4f0] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePurchaseModal}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-5 text-sm font-bold text-[#10243A] transition hover:border-[#0b3a8f]"
                >
                  Odustani
                </button>

                <button
                  type="submit"
                  disabled={isPurchasing}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CreditCard size={18} />
                  {isPurchasing ? "Kupovina..." : "Kupi bonove"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function FoodColumn({ title, items }) {
  return (
    <div className="min-w-0 border-t border-[#dbe4f0] p-4 md:border-r md:border-t-0 md:p-6 last:border-r-0">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
        {title}
      </h3>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-[#F8FBFF] px-4 py-4 text-sm text-slate-400">
            Nema unosa
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="break-words rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-4 text-sm font-semibold text-[#10243A]"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessageBanner({ children, tone = "danger" }) {
  const toneStyles = {
    danger: "border-red-200 bg-red-50 text-red-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${toneStyles[tone]}`}
    >
      <AlertCircle className="shrink-0" size={18} />
      {children}
    </div>
  );
}

function CountInput({ label, onChange, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#10243A] outline-none transition focus:border-[#0b3a8f]"
      />
    </label>
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

function normalizeBreakfastItems(items) {
  return items.map((item) =>
    typeof item === "string"
      ? { naziv: item, bonovi: 1, cijena: "1.20€" }
      : item
  );
}

function parseVoucherValue(value) {
  const normalized = value === "" ? 0 : Number(value);

  if (!Number.isInteger(normalized) || normalized < 0) {
    return null;
  }

  return normalized;
}

function stringifySuggestedCount(value) {
  if (typeof value !== "number") {
    return "";
  }

  return String(value);
}

function normalizeCountInput(value) {
  return value.replace(/\D/g, "").slice(0, 3);
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

function getWeekDays() {
  const today = startOfToday();
  const monday = new Date(today);
  const day = monday.getDay() || 7;

  monday.setDate(today.getDate() - day + 1);

  return [
    "Ponedjeljak",
    "Utorak",
    "Srijeda",
    "Četvrtak",
    "Petak",
    "Subota",
    "Nedjelja",
  ].map((name, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    return {
      name,
      iso: toLocalISO(date),
    };
  });
}

function startOfToday() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

function getTodayISO() {
  return toLocalISO(startOfToday());
}

function getMondayISO(date) {
  const monday = new Date(date);
  const day = monday.getDay() || 7;

  monday.setDate(monday.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  return toLocalISO(monday);
}

function toLocalISO(date) {
  const copy = new Date(date);

  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());

  return copy.toISOString().slice(0, 10);
}

function getMealLabel(key) {
  if (key === "dorucak") return "Doručak";
  if (key === "rucak") return "Ručak";

  return "Večera";
}

function formatDate(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatDateLong(value) {
  if (!value) return "Nije dostupno";

  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "nije dostupno";

  return new Date(value).toLocaleString("sr-Latn-ME", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Menza;






import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Clock3,
  GraduationCap,
  Home,
  ImagePlus,
  KeyRound,
  Mail,
  MapPin,
  Save,
  Ticket,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import useStoredUser from "../hooks/useStoredUser";
import { setStoredAuth, updateStoredUser } from "../utils/authStorage";

const MAX_AVATAR_SIZE_MB = 4;
const EMPTY_BONOVI = {
  dorucak: 0,
  rucak: 0,
  vecera: 0,
  updated_at: null,
};

function Profil() {
  const isResetMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("reset") === "1" ||
      sessionStorage.getItem("passwordResetMode") === "true"
    );
  }, []);

  const user = useStoredUser();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [avatarData, setAvatarData] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [locationTrackingConsent, setLocationTrackingConsent] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [bonovi, setBonovi] = useState(EMPTY_BONOVI);
  const [bonoviMessage, setBonoviMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, bonoviRes] = await Promise.all([
          api.get("/users/me"),
          user?.role === "student" ? api.get("/menza/bonovi") : Promise.resolve(null),
        ]);

        updateStoredUser(profileRes.data.user);

        if (bonoviRes?.data?.bonovi) {
          setBonovi(bonoviRes.data.bonovi);
          setBonoviMessage("");
        } else if (user?.role !== "student") {
          setBonovi(EMPTY_BONOVI);
          setBonoviMessage("");
        }
      } catch {
        if (user?.role === "student") {
          setBonoviMessage("Greška pri učitavanju menza bonova.");
        }
      }
    };

    loadProfile();
  }, [user?.role]);

  useEffect(() => {
    setLocationTrackingConsent(user?.location_tracking_consent === true);
  }, [user?.location_tracking_consent]);

  const rows = [
    { label: "Email adresa", value: user?.email || "-", icon: Mail },
    { label: "Fakultet", value: user?.faculty || "-", icon: GraduationCap },
    {
      label: "Broj indeksa",
      value: user?.index_number || "-",
      icon: BadgeCheck,
    },
    { label: "Studentski dom", value: user?.dorm || "-", icon: Home },
    {
      label: "Tip naloga",
      value: user?.role === "admin" ? "Administracija" : "Student",
      icon: Building2,
    },
  ];

  const resetSelectedAvatar = () => {
    setAvatarData("");
    setAvatarPreview("");
    setAvatarName("");
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMessage("Odaberi isključivo sliku.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setAvatarMessage("Profilna slika može imati najviše 4 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarData(String(reader.result || ""));
      setAvatarPreview(String(reader.result || ""));
      setAvatarName(file.name);
      setAvatarMessage("");
    };

    reader.onerror = () => {
      setAvatarMessage("Greška pri učitavanju slike.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveAvatar = async () => {
    if (!avatarData) {
      return setAvatarMessage("Odaberi novu profilnu sliku.");
    }

    try {
      setIsSavingAvatar(true);
      setAvatarMessage("");

      const res = await api.put("/users/me/avatar", {
        image: avatarData,
      });

      updateStoredUser(res.data.user);
      resetSelectedAvatar();
      setAvatarMessage(res.data.message);
    } catch (error) {
      setAvatarMessage(
        error.response?.data?.message || "Greška pri čuvanju profilne slike."
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!isResetMode && !form.currentPassword) {
      return setMessage("Unesi trenutnu lozinku.");
    }

    if (form.newPassword.length < 6) {
      return setMessage("Nova lozinka mora imati najmanje 6 karaktera.");
    }

    if (form.newPassword !== form.confirmPassword) {
      return setMessage("Nova lozinka i potvrda nijesu iste.");
    }

    try {
      const res = await api.put("/auth/change-password", {
        currentPassword: isResetMode ? undefined : form.currentPassword,
        newPassword: form.newPassword,
      });

      if (res.data.token && res.data.user) {
        sessionStorage.removeItem("passwordResetMode");
        setStoredAuth({
          token: res.data.token,
          user: res.data.user,
          persistent: true,
        });
      }

      setMessage(res.data.message);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri promjeni lozinke."
      );
    }
  };

  const savePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      setPreferenceMessage("");

      const res = await api.put("/users/me/preferences", {
        location_tracking_consent: locationTrackingConsent,
      });

      updateStoredUser(res.data.user);
      setPreferenceMessage(res.data.message);
    } catch (error) {
      setPreferenceMessage(
        error.response?.data?.message ||
          "Greška pri čuvanju podešavanja lokacije."
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <MainLayout>
      <section className="min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          PROFIL KORISNIKA
        </p>

        <h1 className="mt-3 break-words text-lg font-bold text-[#10243A] md:text-2xl lg:text-[34px]">
          Moj profil
        </h1>

        <p className="mt-2 break-words text-sm text-slate-500">
          Pregled osnovnih informacija, promjena profilne slike i lozinke.
        </p>
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              name={user?.name}
              src={avatarPreview || user?.profile_image_url}
              size="xl"
              className="border-4 border-[#0b3a8f]/10"
            />

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Profilna slika
              </p>

              <h2 className="mt-2 break-words text-xl font-bold text-[#10243A] md:text-2xl">
                {user?.name || "Korisnik"}
              </h2>

              <p className="mt-1 break-words text-sm text-slate-500">
                {user?.email || "-"}
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-400">
                JPG, PNG, WEBP ili GIF do 4 MB.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-5 text-sm font-bold text-[#10243A] hover:border-[#0b3a8f]">
              <ImagePlus size={18} />
              Odaberi sliku
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={saveAvatar}
              disabled={!avatarData || isSavingAvatar}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={18} />
              {isSavingAvatar ? "Čuvanje..." : "Sačuvaj sliku"}
            </button>
          </div>
        </div>

        {(avatarName || avatarMessage) && (
          <div className="mt-5 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
            {avatarName && !avatarMessage
              ? `Odabrano: ${avatarName}`
              : avatarMessage}
          </div>
        )}
      </section>

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="overflow-hidden rounded-2xl border border-[#dbe4f0]">
          {rows.map((row, index) => {
            const Icon = row.icon;

            return (
              <div
                key={row.label}
                className={`flex min-w-0 items-center gap-3 bg-white px-4 py-5 md:gap-4 md:px-6 ${
                  index !== rows.length - 1 ? "border-b border-[#dbe4f0]" : ""
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
                  <Icon size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {row.label}
                  </p>

                  <p className="mt-1 break-words text-base font-bold text-[#10243A] md:text-lg">
                    {row.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {user?.role === "student" && (
        <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
              <Ticket size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
                Menza bonovi
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                Ovo je trenutno stanje bonova koje možeš da koristiš u menzi.
                Nakon simulirane kupovine na menza stranici, stanje se ovdje odmah
                osvježava.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <VoucherCard label="Doručak" value={bonovi.dorucak} />
            <VoucherCard label="Ručak" value={bonovi.rucak} />
            <VoucherCard label="Večera" value={bonovi.vecera} />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-3 text-sm font-semibold text-slate-600">
            <Clock3 size={17} className="text-[#0b3a8f]" />
            Posljednje ažuriranje: {formatDateTime(bonovi.updated_at)}
          </div>

          {bonoviMessage && (
            <div className="mt-4 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
              {bonoviMessage}
            </div>
          )}
        </section>
      )}

      {user?.role === "student" && (
        <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
              <MapPin size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
                Praćenje lokacije za čitaonicu
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                Kada je opcija uključena, rezervacija mjesta u čitaonici važi za
                cijeli radni dan i aplikacija prati da li si u radijusu od 30 m
                od adrese 2 Cetinjski Put, Podgorica 81000, Crna Gora. Ako si
                van tog radijusa duže od 60 minuta, mjesto se automatski oslobađa.
              </p>
            </div>
          </div>

          <label className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-4">
            <input
              type="checkbox"
              checked={locationTrackingConsent}
              onChange={(event) =>
                setLocationTrackingConsent(event.target.checked)
              }
              className="mt-1 h-4 w-4"
            />

            <span className="text-sm font-semibold leading-6 text-[#10243A]">
              Dozvoljavam StudMate aplikaciji da prati moju lokaciju dok imam
              aktivnu dnevnu rezervaciju u čitaonici.
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={savePreferences}
              disabled={isSavingPreferences}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white transition hover:bg-[#082d70] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={18} />
              {isSavingPreferences ? "Čuvanje..." : "Sačuvaj podešavanje"}
            </button>

            {preferenceMessage && (
              <div className="rounded-2xl bg-[#0b3a8f]/10 px-4 py-3 text-sm font-bold text-[#0b3a8f]">
                {preferenceMessage}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
            <KeyRound size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#10243A] md:text-2xl">
              Promjena lozinke
            </h2>

            <p className="mt-1 break-words text-sm text-slate-500">
              {isResetMode
                ? "Unesi novu lozinku za svoj nalog."
                : "Unesi trenutnu i novu lozinku."}
            </p>
          </div>
        </div>

        <form
          onSubmit={changePassword}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {!isResetMode && (
            <PasswordInput
              placeholder="Trenutna lozinka"
              value={form.currentPassword}
              onChange={(value) => setForm({ ...form, currentPassword: value })}
            />
          )}

          <PasswordInput
            placeholder="Nova lozinka"
            value={form.newPassword}
            onChange={(value) => setForm({ ...form, newPassword: value })}
          />

          <PasswordInput
            placeholder="Potvrdi novu lozinku"
            value={form.confirmPassword}
            onChange={(value) => setForm({ ...form, confirmPassword: value })}
          />

          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70] md:w-fit">
            <Save size={18} />
            Sačuvaj lozinku
          </button>

          {message && (
            <div className="rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f] md:col-span-3">
              {message}
            </div>
          )}
        </form>
      </section>
    </MainLayout>
  );
}

function VoucherCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[#dbe4f0] bg-[#F8FBFF] p-5">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        Bonovi
      </div>
      <div className="mt-2 text-xl font-bold text-[#10243A]">{label}</div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0b3a8f] px-4 py-2 text-white">
        <Ticket size={18} />
        <span className="text-2xl font-bold">{value ?? 0}</span>
      </div>
    </div>
  );
}

function PasswordInput({ placeholder, value, onChange }) {
  return (
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-12 w-full min-w-0 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
    />
  );
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

export default Profil;

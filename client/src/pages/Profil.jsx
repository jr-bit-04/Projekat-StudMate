import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  GraduationCap,
  Home,
  KeyRound,
  Mail,
  Save,
  User,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function Profil() {
  const isResetMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("reset") === "1" ||
      sessionStorage.getItem("passwordResetMode") === "true"
    );
  }, []);

  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const rows = [
    { label: "Ime i prezime", value: user?.name || "-", icon: User },
    { label: "Email adresa", value: user?.email || "-", icon: Mail },
    { label: "Fakultet", value: user?.faculty || "-", icon: GraduationCap },
    { label: "Broj indeksa", value: user?.index_number || "-", icon: BadgeCheck },
    { label: "Studentski dom", value: user?.dorm || "-", icon: Home },
    {
      label: "Tip naloga",
      value: user?.role === "admin" ? "Administracija" : "Student",
      icon: Building2,
    },
  ];

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
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
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
          Pregled osnovnih informacija i promjena lozinke.
        </p>
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

      <section className="mt-7 min-w-0 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
            <KeyRound size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-[#10243A]">
              Promjena lozinke
            </h2>

            <p className="mt-1 break-words text-sm text-slate-500">
              {isResetMode
                ? "Unesi novu lozinku za svoj nalog."
                : "Unesi trenutnu i novu lozinku."}
            </p>
          </div>
        </div>

        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

export default Profil;

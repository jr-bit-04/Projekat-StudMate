import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Home,
  Info,
  Lock,
  Mail,
  Percent,
  Utensils,
} from "lucide-react";

import api from "../api/axios";
import { setStoredAuth } from "../utils/authStorage";
import AuthLayout from "../components/layout/AuthLayout";
import ucgLogo from "../assets/ucg-logo.png";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const redirectUser = (user) => {
    if (user.role === "admin") {
      if (user.admin_module === "all") {
        window.location.href = "/admin/menza";
        return;
      }

      if (user.admin_module === "menza") {
        window.location.href = "/admin/menza";
        return;
      }

      if (user.admin_module === "dom") {
        window.location.href = "/admin/dom";
        return;
      }

      if (user.admin_module === "citaona") {
        window.location.href = "/admin/citaona";
        return;
      }

      if (user.admin_module === "popusti") {
        window.location.href = "/admin/popusti/moderacija";
        return;
      }

      if (user.admin_module === "stipendije") {
        window.location.href = "/admin/stipendije";
        return;
      }

      window.location.href = "/profil";
      return;
    }

    window.location.href = "/dashboard";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      setStoredAuth({
        token: res.data.token,
        user: res.data.user,
        persistent: true,
      });

      redirectUser(res.data.user);
    } catch (error) {
      if (!error.response) {
        setError("Server nije dostupan ili frontend nije dozvoljen u CORS podešavanjima.");
        return;
      }

      setError(
        error.response?.data?.message || "Greška pri prijavi."
      );
    }
  };

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <div className="mb-3 flex justify-center">
          <img
            src={ucgLogo}
            alt="UCG Logo"
            className="w-[130px] object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]"
          />
        </div>

        <h1 className="text-[46px] font-black leading-none tracking-[-0.05em]">
          <span className="text-white">Stud</span>
          <span className="text-[#3f94ff]">Mate</span>
        </h1>

        <p className="mt-2 text-[14px] leading-5 text-blue-100/90">
          Sve studentske informacije na jednom mjestu
        </p>
      </div>

      <section className="rounded-[24px] border border-[#4c9cff]/40 bg-[#062763]/70 px-7 py-6 shadow-[0_0_60px_rgba(31,117,255,0.35)] backdrop-blur-[18px]">
        <div className="mb-5 text-center">
          <h2 className="text-[28px] font-black text-[#62a8ff]">
            Prijava
          </h2>

          <p className="mt-1 text-[14px] text-blue-50/90">
            Unesi podatke za pristup nalogu
          </p>
        </div>

        <form onSubmit={submit}>
          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={handleChange}
          />

          <Input
            icon={Lock}
            name="password"
            type="password"
            placeholder="Lozinka"
            value={form.password}
            onChange={handleChange}
          />

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button className="relative mt-1 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3b82ff] to-[#1672f6] text-[17px] font-black text-white shadow-[0_10px_30px_rgba(24,116,242,0.45)] transition duration-200 hover:scale-[1.01]">
            PRIJAVI SE
            <ArrowRight className="absolute right-6" size={22} />
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-[#4da3ff]"
          >
            Zaboravljena lozinka?
          </Link>
        </div>

        <div className="my-5 flex items-center gap-5 text-[14px] text-blue-100/80">
          <div className="h-px flex-1 bg-blue-300/20" />
          <span>ili</span>
          <div className="h-px flex-1 bg-blue-300/20" />
        </div>

        <p className="text-center text-[15px] text-blue-50/90">
          Nemaš nalog?{" "}
          <Link to="/register" className="font-bold text-[#4da3ff]">
            Registruj se
          </Link>
        </p>

        <div className="mt-6 grid grid-cols-5 text-center text-[13px] text-white">
          <Feature icon={Home} label="Dom" />
          <Feature icon={Utensils} label="Menza" />
          <Feature icon={BookOpen} label="Čitaona" />
          <Feature icon={Percent} label="Popusti" />
          <Feature icon={Info} label="Info" />
        </div>
      </section>

      <p className="mt-5 text-center text-[15px] text-blue-100/80">
        Partner ste?{" "}
        <Link to="/partner-popusti" className="font-bold text-[#4da3ff]">
          Partnerski portal
        </Link>
      </p>
    </AuthLayout>
  );
}

function Input({
  icon: Icon,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="relative mb-4">
      <Icon className="absolute left-5 top-4 text-[#4da3ff]" size={20} />

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-[52px] w-full rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-5 text-[15px] text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
      />
    </div>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={24} className="text-[#3f94ff]" />
      <span>{label}</span>
    </div>
  );
}

export default Login;

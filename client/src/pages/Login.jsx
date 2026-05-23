import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Eye,
  Home,
  Info,
  Lock,
  Mail,
  Percent,
  Utensils,
} from "lucide-react";

import api from "../api/axios";
import AuthLayout from "../components/layout/AuthLayout";
import ucgLogo from "../assets/ucg-logo.png";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const storage = form.remember ? localStorage : sessionStorage;

      storage.setItem("token", res.data.token);
      storage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri prijavi.");
    }
  };

  return (
    <AuthLayout>
      <div className="mb-3 text-center">
        <div className="mb-2 flex justify-center">
          <img
            src={ucgLogo}
            alt="UCG Logo"
            className="w-[150px] object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]"
          />
        </div>

        <h1 className="text-[48px] font-black leading-none tracking-[-0.05em]">
          <span className="text-white">Stud</span>
          <span className="text-[#3f94ff]">Mate</span>
        </h1>

        <p className="mt-2 text-[15px] leading-5 text-blue-100/90">
          Sve studentske informacije
          <br />
          na jednom mjestu
        </p>
      </div>

      <section className="rounded-[24px] border border-[#4c9cff]/40 bg-[#062763]/70 px-7 py-5 shadow-[0_0_60px_rgba(31,117,255,0.35)] backdrop-blur-[18px]">
        <div className="mb-5 text-center">
          <h2 className="text-[28px] font-black text-[#62a8ff]">
            Dobrodošla nazad!
          </h2>

          <p className="mt-1 text-[15px] text-blue-50/90">
            Prijavi se na svoj StudMate nalog
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-3">
            <Mail className="absolute left-5 top-4 text-[#4da3ff]" size={20} />

            <input
              name="email"
              type="email"
              placeholder="studentski@email.com"
              value={form.email}
              onChange={handleChange}
              className="h-[50px] w-full rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-5 text-[15px] text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
            />
          </div>

          <div className="relative mb-3">
            <Lock className="absolute left-5 top-4 text-[#4da3ff]" size={20} />

            <input
              name="password"
              type="password"
              placeholder="Lozinka"
              value={form.password}
              onChange={handleChange}
              className="h-[50px] w-full rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-14 text-[15px] text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
            />

            <Eye className="absolute right-5 top-4 text-blue-200/60" size={20} />
          </div>
          <div className="flex justify-end mt-2 mb-5">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-300 hover:text-white transition leading-normal pb-1"
            >
              Zaboravljena lozinka?
            </Link>
          </div>

          {message && (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {message}
            </div>
          )}

          <button className="relative flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3b82ff] to-[#1672f6] text-[17px] font-black text-white shadow-[0_10px_30px_rgba(24,116,242,0.45)] transition duration-200 hover:scale-[1.01]">
            PRIJAVI SE
            <ArrowRight className="absolute right-6" size={22} />
          </button>
        </form>

        <div className="my-4 flex items-center gap-5 text-[14px] text-blue-100/80">
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

        <div className="mt-5 grid grid-cols-5 text-center text-[13px] text-white">
          <Feature icon={Home} label="Dom" />
          <Feature icon={Utensils} label="Menza" />
          <Feature icon={BookOpen} label="Čitaona" />
          <Feature icon={Percent} label="Popusti" />
          <Feature icon={Info} label="Info" />
        </div>
      </section>

      <footer className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2 text-[16px] font-bold text-[#4da3ff]">
          <img src={ucgLogo} alt="UCG" className="h-6 w-6 object-contain" />
          Univerzitet Crne Gore
        </div>

        <p className="mt-1 text-[14px] text-blue-200/80">
          Studiraj. Informiši se. Ostvari više.
        </p>
      </footer>
    </AuthLayout>
  );
};

function Feature({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={24} className="text-[#3f94ff]" />
      <span>{label}</span>
    </div>
  );
}

export default Login;
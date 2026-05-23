import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

import {
  ArrowLeft,
  Mail,
  Send,
} from "lucide-react";

import AuthLayout from "../components/layout/AuthLayout";
import ucgLogo from "../assets/ucg-logo.png";

const ForgotPassword = () => {

  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email) {
    return setMessage("Unesi email adresu.");
  }

  try {
    const res = await api.post("/auth/forgot-password", { email });
    setMessage(res.data.message);
  } catch (error) {
    setMessage(error.response?.data?.message || "Greška pri slanju zahtjeva.");
  }
};

  return (

    <AuthLayout>

      {/* LOGO */}

      <div className="mb-3 text-center">

        <div className="mb-2 flex justify-center">

          <img
            src={ucgLogo}
            alt="UCG Logo"
            className="w-[140px] object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]"
          />

        </div>

        <h1 className="text-[44px] font-black leading-none tracking-[-0.05em]">

          <span className="text-white">
            Stud
          </span>

          <span className="text-[#3f94ff]">
            Mate
          </span>

        </h1>

        <p className="mt-2 text-[15px] text-blue-100/90">
          Resetuj svoju lozinku
        </p>

      </div>

      {/* CARD */}

      <section className="rounded-[24px] border border-[#4c9cff]/40 bg-[#062763]/70 px-7 py-6 shadow-[0_0_60px_rgba(31,117,255,0.35)] backdrop-blur-[18px]">

        <div className="mb-5 text-center">

          <h2 className="text-[28px] font-black text-[#62a8ff]">
            Zaboravljena lozinka
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-blue-50/90">

            Unesi svoju email adresu i
            poslaćemo ti link za reset lozinke.

          </p>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="relative mb-4">

            <Mail
              className="absolute left-5 top-4 text-[#4da3ff]"
              size={20}
            />

            <input
              type="email"
              placeholder="studentski@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[50px] w-full rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-5 text-[15px] text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
            />

          </div>

          {message && (

            <div className="mb-4 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">

              {message}

            </div>

          )}

          <button className="relative flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3b82ff] to-[#1672f6] text-[17px] font-black text-white shadow-[0_10px_30px_rgba(24,116,242,0.45)] transition duration-200 hover:scale-[1.01]">

            POŠALJI LINK

            <Send
              className="absolute right-6"
              size={20}
            />

          </button>

        </form>

        <div className="mt-5 text-center">

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#63a9ff]"
          >

            <ArrowLeft size={18} />

            Nazad na prijavu

          </Link>

        </div>

      </section>

    </AuthLayout>

  );
};

export default ForgotPassword;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Home,
  Info,
  Lock,
  Mail,
  Percent,
  Utensils,
  User,
} from "lucide-react";

import api from "../api/axios";
import AuthLayout from "../components/layout/AuthLayout";
import ucgLogo from "../assets/ucg-logo.png";

const dormOptions = [
  "Novi studentski dom",
  "I faza",
  "II faza",
  "Plavi dvor",
  "Stari studentski dom",
];

const facultyOptions = [
  "Arhitektonski fakultet",
  "Biotehnički fakultet",
  "Ekonomski fakultet",
  "Elektrotehnički fakultet",
  "Fakultet političkih nauka",
  "Mašinski fakultet",
  "Medicinski fakultet",
  "Metalurško-tehnološki fakultet",
  "Muzička akademija - Podgorica",
  "Pravni fakultet",
  "Prirodno-matematički fakultet",
];

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    faculty: "",
    dorm: "",
    index_number: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", {
        ...form,
        role: "student",
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri registraciji.");
    }
  };

  return (
    <AuthLayout>
      <div className="mb-3 text-center">
        <div className="mb-2 flex justify-center">
          <img
            src={ucgLogo}
            alt="UCG Logo"
            className="w-[125px] object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]"
          />
        </div>

        <h1 className="text-[44px] font-black leading-none tracking-[-0.05em]">
          <span className="text-white">Stud</span>
          <span className="text-[#3f94ff]">Mate</span>
        </h1>

        <p className="mt-2 text-[14px] leading-5 text-blue-100/90">
          Kreiraj studentski nalog
        </p>
      </div>

      <section className="rounded-[24px] border border-[#4c9cff]/40 bg-[#062763]/70 px-7 py-5 shadow-[0_0_60px_rgba(31,117,255,0.35)] backdrop-blur-[18px]">
        <div className="mb-4 text-center">
          <h2 className="text-[26px] font-black text-[#62a8ff]">
            Registracija
          </h2>

          <p className="mt-1 text-[14px] text-blue-50/90">
            Unesi osnovne studentske podatke
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            icon={User}
            name="name"
            placeholder="Ime i prezime"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder="studentski@email.com"
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

          <SelectInput
            icon={GraduationCap}
            name="faculty"
            value={form.faculty}
            onChange={handleChange}
            placeholder="Izaberi fakultet"
            options={facultyOptions}
          />

          <SelectInput
            icon={Home}
            name="dorm"
            value={form.dorm}
            onChange={handleChange}
            placeholder="Izaberi dom"
            options={dormOptions}
          />

          <Input
            icon={Building2}
            name="index_number"
            placeholder="Broj indeksa (npr. 23/23)"
            value={form.index_number}
            onChange={handleChange}
          />

          {message && (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {message}
            </div>
          )}

          <button className="relative mt-1 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3b82ff] to-[#1672f6] text-[17px] font-black text-white shadow-[0_10px_30px_rgba(24,116,242,0.45)] transition duration-200 hover:scale-[1.01]">
            REGISTRUJ SE
            <ArrowRight className="absolute right-6" size={22} />
          </button>
        </form>

        <div className="my-4 flex items-center gap-5 text-[14px] text-blue-100/80">
          <div className="h-px flex-1 bg-blue-300/20" />
          <span>ili</span>
          <div className="h-px flex-1 bg-blue-300/20" />
        </div>

        <p className="text-center text-[15px] text-blue-50/90">
          Već imaš nalog?{" "}
          <Link to="/login" className="font-bold text-[#4da3ff]">
            Prijavi se
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
    </AuthLayout>
  );
};

function Input({ icon: Icon, name, type = "text", placeholder, value, onChange }) {
  return (
    <div className="relative mb-3">
      <Icon className="absolute left-5 top-4 text-[#4da3ff]" size={20} />

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-[50px] w-full rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-5 text-[15px] text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
      />
    </div>
  );
}

function SelectInput({ icon: Icon, name, value, onChange, options, placeholder }) {
  return (
    <div className="relative mb-3">
      <Icon className="absolute left-5 top-4 text-[#4da3ff]" size={20} />

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-[50px] w-full appearance-none rounded-[14px] border border-[#4c8ddd]/45 bg-[#041b48]/80 pl-14 pr-5 text-[15px] text-white outline-none focus:border-[#6db5ff]"
      >
        <option value="" className="bg-[#041b48]">
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option} value={option} className="bg-[#041b48]">
            {option}
          </option>
        ))}
      </select>
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

export default Register;
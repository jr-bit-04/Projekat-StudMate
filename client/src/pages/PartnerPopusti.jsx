import { useState } from "react";
import { Send, Store } from "lucide-react";

import api from "../api/axios";
import AuthLayout from "../components/layout/AuthLayout";

function PartnerPopusti() {
  const [form, setForm] = useState({
    naziv: "",
    website: "",
    logo_url: "",
    kontakt_email: "",
    naslov: "",
    opis: "",
    kategorija: "",
    vrijednost: "",
    kod: "",
    valid_from: "",
    valid_until: "",
    lokacija: "",
    image_url: "",
  });

  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/popusti/partner/submit", form);

      setMessage(res.data.message);

      setForm({
        naziv: "",
        website: "",
        logo_url: "",
        kontakt_email: "",
        naslov: "",
        opis: "",
        kategorija: "",
        vrijednost: "",
        kod: "",
        valid_from: "",
        valid_until: "",
        lokacija: "",
        image_url: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Greška pri slanju promocije."
      );
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-3xl rounded-[28px] border border-[#4c9cff]/40 bg-[#062763]/75 p-8 shadow-[0_0_60px_rgba(31,117,255,0.35)] backdrop-blur-[18px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3f94ff]/20 text-[#62a8ff]">
            <Store size={28} />
          </div>

          <h1 className="text-[34px] font-black text-white">
            Partnerski portal
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Pošaljite studentsku promociju na moderaciju.
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Input label="Naziv ustanove" name="naziv" form={form} setForm={setForm} />
          <Input label="Kontakt email" name="kontakt_email" form={form} setForm={setForm} />
          <Input label="Website" name="website" form={form} setForm={setForm} />
          <Input label="Logo URL" name="logo_url" form={form} setForm={setForm} />

          <Input label="Naslov promocije" name="naslov" form={form} setForm={setForm} />
          <Input label="Kategorija" name="kategorija" form={form} setForm={setForm} />
          <Input label="Vrijednost popusta" name="vrijednost" placeholder="npr. 20%" form={form} setForm={setForm} />
          <Input label="Kod kupona" name="kod" form={form} setForm={setForm} />
          <Input label="Važi od" name="valid_from" type="date" form={form} setForm={setForm} />
          <Input label="Važi do" name="valid_until" type="date" form={form} setForm={setForm} />
          <Input label="Lokacija" name="lokacija" form={form} setForm={setForm} />
          <Input label="Slika URL" name="image_url" form={form} setForm={setForm} />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-blue-100">
              Opis i uslovi korišćenja
            </label>

            <textarea
              value={form.opis}
              onChange={(e) => setForm({ ...form, opis: e.target.value })}
              rows="5"
              className="w-full rounded-2xl border border-[#4c8ddd]/45 bg-[#041b48]/80 px-4 py-3 text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
            />
          </div>

          {message && (
            <div className="md:col-span-2 rounded-2xl bg-white/10 p-4 text-sm font-bold text-white">
              {message}
            </div>
          )}

          <button className="md:col-span-2 mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3b82ff] to-[#1672f6] text-sm font-black text-white">
            <Send size={18} />
            Pošalji na moderaciju
          </button>
        </form>
      </section>
    </AuthLayout>
  );
}

function Input({ label, name, form, setForm, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-blue-100">
        {label}
      </label>

      <input
        type={type}
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="h-12 w-full rounded-2xl border border-[#4c8ddd]/45 bg-[#041b48]/80 px-4 text-white outline-none placeholder:text-blue-200/60 focus:border-[#6db5ff]"
      />
    </div>
  );
}

export default PartnerPopusti;
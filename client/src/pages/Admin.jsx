import { useState } from "react";
import {
  Bell,
  CalendarDays,
  GraduationCap,
  Percent,
  UtensilsCrossed,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function Admin() {
  return (
    <MainLayout>
      <section className="rounded-[32px] bg-[#0b3a8f] p-8 text-white shadow-xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
          ADMIN PANEL
        </p>

        <h1 className="text-[38px] font-black tracking-[-0.05em]">
          Upravljanje StudMate podacima
        </h1>

        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-blue-50/90">
          Dodavanje obavještenja, menija, stipendija i popusta direktno u bazu.
        </p>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-2">
        <AnnouncementForm />
        <MenuForm />
        <ScholarshipForm />
        <DiscountForm />
      </section>
    </MainLayout>
  );
}

function AnnouncementForm() {
  const [form, setForm] = useState({
    modul: "dom",
    naslov: "",
    opis: "",
    kategorija: "",
    priority: 1,
    pinned: false,
  });

  return (
    <AdminCard icon={Bell} title="Novo obavještenje">
      <FormMessageForm
        endpoint="/admin/announcements"
        form={form}
        setForm={setForm}
        buttonText="Dodaj obavještenje"
      >
        <Select name="modul" value={form.modul} onChange={setFormValue(setForm, form)}>
          <option value="dom">Dom</option>
          <option value="menza">Menza</option>
          <option value="citaona">Čitaonica</option>
          <option value="stipendije">Stipendije</option>
          <option value="popusti">Popusti</option>
        </Select>

        <Input name="naslov" placeholder="Naslov" value={form.naslov} onChange={setFormValue(setForm, form)} />
        <Textarea name="opis" placeholder="Opis obavještenja" value={form.opis} onChange={setFormValue(setForm, form)} />
        <Input name="kategorija" placeholder="Kategorija" value={form.kategorija} onChange={setFormValue(setForm, form)} />
      </FormMessageForm>
    </AdminCard>
  );
}

function MenuForm() {
  const [form, setForm] = useState({
    datum: "",
    tip_obroka: "dorucak",
    naslov: "",
    opis: "",
    aktivan: true,
  });

  return (
    <AdminCard icon={UtensilsCrossed} title="Dodaj meni">
      <FormMessageForm
        endpoint="/admin/menu"
        form={form}
        setForm={setForm}
        buttonText="Dodaj obrok"
      >
        <Input name="datum" type="date" value={form.datum} onChange={setFormValue(setForm, form)} />

        <Select name="tip_obroka" value={form.tip_obroka} onChange={setFormValue(setForm, form)}>
          <option value="dorucak">Doručak</option>
          <option value="rucak">Ručak</option>
          <option value="vecera">Večera</option>
        </Select>

        <Input name="naslov" placeholder="Naziv obroka" value={form.naslov} onChange={setFormValue(setForm, form)} />
        <Textarea name="opis" placeholder="Opis menija" value={form.opis} onChange={setFormValue(setForm, form)} />
      </FormMessageForm>
    </AdminCard>
  );
}

function ScholarshipForm() {
  const [form, setForm] = useState({
    naslov: "",
    institucija: "",
    tip: "",
    opis: "",
    iznos: "",
    rok: "",
    link: "",
    aktivan: true,
  });

  return (
    <AdminCard icon={GraduationCap} title="Dodaj stipendiju">
      <FormMessageForm
        endpoint="/admin/scholarships"
        form={form}
        setForm={setForm}
        buttonText="Dodaj stipendiju"
      >
        <Input name="naslov" placeholder="Naslov" value={form.naslov} onChange={setFormValue(setForm, form)} />
        <Input name="institucija" placeholder="Institucija" value={form.institucija} onChange={setFormValue(setForm, form)} />
        <Input name="tip" placeholder="Tip / kategorija" value={form.tip} onChange={setFormValue(setForm, form)} />
        <Input name="iznos" placeholder="Iznos" value={form.iznos} onChange={setFormValue(setForm, form)} />
        <Input name="rok" type="date" value={form.rok} onChange={setFormValue(setForm, form)} />
        <Input name="link" placeholder="Link konkursa" value={form.link} onChange={setFormValue(setForm, form)} />
        <Textarea name="opis" placeholder="Opis" value={form.opis} onChange={setFormValue(setForm, form)} />
      </FormMessageForm>
    </AdminCard>
  );
}

function DiscountForm() {
  const [form, setForm] = useState({
    partner_id: "",
    naslov: "",
    opis: "",
    kategorija: "",
    vrijednost: "",
    kod: "",
    valid_from: "",
    valid_until: "",
    lokacija: "",
    aktivan: true,
  });

  return (
    <AdminCard icon={Percent} title="Dodaj popust">
      <FormMessageForm
        endpoint="/admin/discounts"
        form={form}
        setForm={setForm}
        buttonText="Dodaj popust"
      >
        <Input name="partner_id" placeholder="ID partnera" value={form.partner_id} onChange={setFormValue(setForm, form)} />
        <Input name="naslov" placeholder="Naslov" value={form.naslov} onChange={setFormValue(setForm, form)} />
        <Input name="kategorija" placeholder="Kategorija" value={form.kategorija} onChange={setFormValue(setForm, form)} />
        <Input name="vrijednost" placeholder="Vrijednost popusta npr. 20%" value={form.vrijednost} onChange={setFormValue(setForm, form)} />
        <Input name="kod" placeholder="Kod za popust" value={form.kod} onChange={setFormValue(setForm, form)} />
        <Input name="valid_from" type="date" value={form.valid_from} onChange={setFormValue(setForm, form)} />
        <Input name="valid_until" type="date" value={form.valid_until} onChange={setFormValue(setForm, form)} />
        <Input name="lokacija" placeholder="Lokacija" value={form.lokacija} onChange={setFormValue(setForm, form)} />
        <Textarea name="opis" placeholder="Opis" value={form.opis} onChange={setFormValue(setForm, form)} />
      </FormMessageForm>
    </AdminCard>
  );
}

function FormMessageForm({ endpoint, form, setForm, buttonText, children }) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        partner_id: form.partner_id ? Number(form.partner_id) : null,
      };

      const res = await api.post(endpoint, payload);
      setMessage(res.data.message || "Uspješno sačuvano.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri čuvanju.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {children}

      {message && (
        <div className="rounded-2xl bg-[#0b3a8f]/10 p-3 text-sm font-bold text-[#0b3a8f]">
          {message}
        </div>
      )}

      <button className="mt-2 h-12 rounded-2xl bg-[#0b3a8f] font-black text-white transition hover:bg-[#082d70]">
        {buttonText}
      </button>
    </form>
  );
}

function AdminCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
          <Icon size={24} />
        </div>

        <h2 className="text-xl font-black text-[#10243a]">{title}</h2>
      </div>

      {children}
    </div>
  );
}

function Input({ name, type = "text", placeholder, value, onChange }) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-12 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
    />
  );
}

function Textarea({ name, placeholder, value, onChange }) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows="4"
      className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
    />
  );
}

function Select({ name, value, onChange, children }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="h-12 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
    >
      {children}
    </select>
  );
}

function setFormValue(setForm, form) {
  return (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };
}

export default Admin;

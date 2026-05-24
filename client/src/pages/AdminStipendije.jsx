import { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const initialState = {
  naslov: "",
  institucija: "",
  tip: "stipendija",
  opis: "",
  iznos: "",
  rok: "",
  link: "",
  aktivan: true,
};

function AdminStipendije() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get("/stipendije/admin");
    setItems(res.data.konkursi || []);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await api.put(`/stipendije/admin/${editingId}`, form);
    } else {
      await api.post("/stipendije/admin", form);
    }

    setForm(initialState);
    setEditingId(null);
    fetchData();
  };

  const editItem = (item) => {
    setEditingId(item.id);

    setForm({
      naslov: item.naslov || "",
      institucija: item.institucija || "",
      tip: item.tip || "stipendija",
      opis: item.opis || "",
      iznos: item.iznos || "",
      rok: item.rok?.slice(0, 10) || "",
      link: item.link || "",
      aktivan: item.aktivan,
    });
  };

  const remove = async (id) => {
    await api.delete(`/stipendije/admin/${id}`);
    fetchData();
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN STIPENDIJE
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Upravljanje konkursima
        </h1>
      </section>

      <form
        onSubmit={submit}
        className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Naslov" value={form.naslov} onChange={(v) => setForm({ ...form, naslov: v })} />
          <Input label="Institucija" value={form.institucija} onChange={(v) => setForm({ ...form, institucija: v })} />

          <div>
            <label className="mb-2 block text-sm font-bold text-[#10243A]">
              Tip
            </label>

            <select
              value={form.tip}
              onChange={(e) =>
                setForm({ ...form, tip: e.target.value })
              }
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4"
            >
              <option value="stipendija">Stipendija</option>
              <option value="kredit">Kredit</option>
            </select>
          </div>

          <Input label="Iznos" value={form.iznos} onChange={(v) => setForm({ ...form, iznos: v })} />
          <Input label="Rok" type="date" value={form.rok} onChange={(v) => setForm({ ...form, rok: v })} />
          <Input label="Link" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-bold text-[#10243A]">
            Opis
          </label>

          <textarea
            value={form.opis}
            onChange={(e) =>
              setForm({ ...form, opis: e.target.value })
            }
            rows="5"
            className="w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-3"
          />
        </div>

        <button className="mt-5 flex h-12 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white">
          <Plus size={18} />
          {editingId ? "Sačuvaj izmjene" : "Dodaj konkurs"}
        </button>
      </form>

      <section className="mt-7 grid gap-5">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
              <div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
                    {item.tip}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-[#10243A]">
                  {item.naslov}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {item.institucija}
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {item.opis}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => editItem(item)}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-[#0b3a8f]/10 px-4 text-sm font-bold text-[#0b3a8f]"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={() => remove(item.id)}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-bold text-red-600"
                >
                  <Trash2 size={16} />
                  Obriši
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </MainLayout>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10243A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4"
      />
    </div>
  );
}

export default AdminStipendije;

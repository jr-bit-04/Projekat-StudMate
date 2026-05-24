import { useEffect, useState } from "react";
import { Bell, Pencil, Save, Trash2, X } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

function AdminDomObavjestenja() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    naslov: "",
    opis: "",
    kategorija: "Dom",
    priority: 1,
    pinned: false,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get("/dom/admin/obavjestenja");
      setItems(res.data.obavjestenja || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri učitavanju obavještenja.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editingId) {
        const res = await api.put(`/dom/admin/obavjestenja/${editingId}`, form);
        setMessage(res.data.message);
      } else {
        const res = await api.post("/dom/admin/obavjestenja", form);
        setMessage(res.data.message);
      }

      setForm({
        naslov: "",
        opis: "",
        kategorija: "Dom",
        priority: 1,
        pinned: false,
      });

      setEditingId(null);
      fetchNotices();
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri čuvanju obavještenja.");
    }
  };

  const editNotice = (item) => {
    setEditingId(item.id);
    setForm({
      naslov: item.naslov || "",
      opis: item.opis || "",
      kategorija: item.kategorija || "Dom",
      priority: item.priority || 1,
      pinned: item.pinned || false,
    });
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("Obrisati obavještenje?")) return;

    try {
      await api.delete(`/dom/admin/obavjestenja/${id}`);
      fetchNotices();
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri brisanju obavještenja.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      naslov: "",
      opis: "",
      kategorija: "Dom",
      priority: 1,
      pinned: false,
    });
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN DOM
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Obavještenja doma
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Dodavanje, izmjena i brisanje obavještenja za studentski dom.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-3">
          <Bell className="text-[#0b3a8f]" />
          <h2 className="text-2xl font-bold text-[#10243A]">
            {editingId ? "Izmijeni obavještenje" : "Novo obavještenje"}
          </h2>
        </div>

        <input
          value={form.naslov}
          onChange={(e) => setForm({ ...form, naslov: e.target.value })}
          placeholder="Naslov obavještenja"
          className="mb-4 h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 outline-none focus:border-[#0b3a8f]"
        />

        <textarea
          value={form.opis}
          onChange={(e) => setForm({ ...form, opis: e.target.value })}
          placeholder="Tekst obavještenja"
          rows="5"
          className="w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 py-3 outline-none focus:border-[#0b3a8f]"
        />

        {message && (
          <div className="mt-5 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
            {message}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button className="flex h-12 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]">
            <Save size={18} />
            {editingId ? "Sačuvaj izmjene" : "Objavi obavještenje"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex h-12 items-center gap-2 rounded-2xl border border-[#dbe4f0] px-6 text-sm font-bold text-[#10243A]"
            >
              <X size={18} />
              Otkaži
            </button>
          )}
        </div>
      </form>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#10243A]">
          Objavljena obavještenja
        </h2>

        <div className="mt-6 grid gap-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dbe4f0] p-6 text-sm text-slate-500">
              Još nema obavještenja.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
                      {item.kategorija || "Dom"}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-[#10243A]">
                      {item.naslov}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.opis}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editNotice(item)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3a8f]/10 text-[#0b3a8f]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteNotice(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </MainLayout>
  );
}

export default AdminDomObavjestenja;

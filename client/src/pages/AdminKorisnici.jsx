import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, X, Save, ShieldCheck, User } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const adminModules = [
  { value: "all", label: "Globalni admin (sve)" },
  { value: "menza", label: "Menza" },
  { value: "dom", label: "Dom" },
  { value: "citaona", label: "Čitaonica" },
  { value: "popusti", label: "Popusti" },
  { value: "stipendije", label: "Stipendije" },
];

const inputClass =
  "h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]";

function getCurrentUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );
}

function AdminKorisnici() {
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError("");
      const res = await api.get(`/users/admin?search=${encodeURIComponent(search)}`);
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri učitavanju korisnika.");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Obrisati korisnika ${user.name}? Ova akcija je trajna.`)) {
      return;
    }

    try {
      setError("");
      setMessage("");
      const res = await api.delete(`/users/admin/${user.id}`);
      setMessage(res.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri brisanju korisnika.");
    }
  };

  const saveUser = async (form) => {
    try {
      setError("");
      setMessage("");
      const res = await api.put(`/users/admin/${form.id}`, {
        name: form.name,
        email: form.email,
        role: form.role,
        admin_module: form.role === "admin" ? form.admin_module || null : null,
        dorm: form.dorm,
        faculty: form.faculty,
        index_number: form.index_number,
      });

      setMessage(res.data.message);
      setEditing(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Greška pri čuvanju korisnika.");
    }
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN
        </p>

        <h1 className="mt-3 text-2xl font-bold text-[#10243A] md:text-[34px]">
          Upravljanje korisnicima
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pregled svih korisnika aplikacije. Možeš mijenjati podatke i uloge ili
          obrisati nalog.
        </p>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Pretraži po imenu, emailu, fakultetu ili indeksu..."
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </div>

          <button
            onClick={fetchUsers}
            className="h-12 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]"
          >
            Pretraži
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6">
        <div className="overflow-x-auto rounded-2xl border border-[#dbe4f0]">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.6fr_1fr_1.2fr_150px] bg-[#F8FBFF]">
              <Head text="Korisnik" />
              <Head text="Uloga" />
              <Head text="Fakultet / indeks" />
              <Head text="" />
            </div>

            {users.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Nema korisnika.</div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1.6fr_1fr_1.2fr_150px] border-t border-[#dbe4f0] bg-white"
                >
                  <Cell>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#10243A]">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </Cell>

                  <Cell>
                    <RoleBadge user={user} />
                  </Cell>

                  <Cell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#10243A]">
                        {user.faculty || "-"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.index_number || "-"}
                      </p>
                    </div>
                  </Cell>

                  <Cell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(user)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b3a8f]/10 text-[#0b3a8f] hover:bg-[#0b3a8f]/20"
                        title="Izmijeni"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => deleteUser(user)}
                        disabled={user.id === currentUser?.id}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Obriši"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Cell>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={saveUser}
        />
      )}
    </MainLayout>
  );
}

function RoleBadge({ user }) {
  if (user.role !== "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        <User size={13} />
        Student
      </span>
    );
  }

  const label =
    user.admin_module === "all"
      ? "Globalni admin"
      : `Admin · ${user.admin_module || "—"}`;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b3a8f]/10 px-3 py-1 text-xs font-bold text-[#0b3a8f]">
      <ShieldCheck size={13} />
      {label}
    </span>
  );
}

function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "student",
    admin_module: user.admin_module || "",
    dorm: user.dorm || "",
    faculty: user.faculty || "",
    index_number: user.index_number || "",
  });

  const change = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#10243A]">Izmjena korisnika</h2>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <ModalField label="Ime i prezime">
            <input
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={inputClass}
            />
          </ModalField>

          <ModalField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
              className={inputClass}
            />
          </ModalField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Uloga">
              <select
                value={form.role}
                onChange={(e) => change("role", e.target.value)}
                className={inputClass}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </ModalField>

            {form.role === "admin" && (
              <ModalField label="Admin modul">
                <select
                  value={form.admin_module}
                  onChange={(e) => change("admin_module", e.target.value)}
                  className={inputClass}
                >
                  <option value="">— izaberi —</option>
                  {adminModules.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </ModalField>
            )}
          </div>

          <ModalField label="Studentski dom">
            <input
              value={form.dorm}
              onChange={(e) => change("dorm", e.target.value)}
              className={inputClass}
            />
          </ModalField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Fakultet">
              <input
                value={form.faculty}
                onChange={(e) => change("faculty", e.target.value)}
                className={inputClass}
              />
            </ModalField>

            <ModalField label="Broj indeksa">
              <input
                value={form.index_number}
                onChange={(e) => change("index_number", e.target.value)}
                className={inputClass}
              />
            </ModalField>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-11 rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-600 hover:bg-slate-200"
          >
            Otkaži
          </button>

          <button
            onClick={() => onSave(form)}
            className="flex h-11 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-5 text-sm font-bold text-white hover:bg-[#082d70]"
          >
            <Save size={16} />
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10243A]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Head({ text }) {
  return (
    <div className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
      {text}
    </div>
  );
}

function Cell({ children }) {
  return (
    <div className="flex min-w-0 items-center border-l border-[#dbe4f0] p-4 first:border-l-0">
      {children}
    </div>
  );
}

export default AdminKorisnici;

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Home,
  Save,
  Search,
  User,
  XCircle,
} from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const months = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

function AdminDom() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [obligations, setObligations] = useState([]);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    mjesec: "Maj",
    godina: new Date().getFullYear(),
    iznos: "",
    uplaceno: "",
    due_date: "",
    paid_at: "",
    boravi_u_domu: true,
  });

  const fetchStudents = async () => {
    try {
      const res = await api.get(
        `/dom/admin/studenti?search=${search}`
      );

      setStudents(res.data.students || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri pretrazi studenata."
      );
    }
  };

  const selectStudent = async (student) => {
    try {
      setSelectedStudent(student);

      const res = await api.get(
        `/dom/admin/studenti/${student.id}/obaveze`
      );

      setObligations(res.data.obligations || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri učitavanju obaveza."
      );
    }
  };

  const saveObligation = async () => {
    if (!selectedStudent) return;

    try {
      const res = await api.post(
        `/dom/admin/studenti/${selectedStudent.id}/obaveze`,
        form
      );

      setMessage(res.data.message);

      selectStudent(selectedStudent);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Greška pri čuvanju obaveze."
      );
    }
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN DOM
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Upravljanje studentima doma
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pretraga studenata, pregled obaveza i unos uplata.
        </p>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Pretraži po imenu, fakultetu ili indeksu..."
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </div>

          <button
            onClick={fetchStudents}
            className="h-12 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]"
          >
            Pretraži
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() =>
                selectStudent(student)
              }
              className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
                selectedStudent?.id ===
                student.id
                  ? "border-[#0b3a8f] bg-[#0b3a8f]/10"
                  : "border-[#dbe4f0] bg-white hover:bg-[#F8FBFF]"
              }`}
            >
              <div>
                <h3 className="text-lg font-bold text-[#10243A]">
                  {student.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {student.faculty}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-[#0b3a8f]">
                  {student.index_number}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {student.dorm}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedStudent && (
        <>
          <section className="mt-7 grid gap-5 md:grid-cols-3">
            <InfoCard
              icon={User}
              title="Student"
              value={selectedStudent.name}
            />

            <InfoCard
              icon={Building2}
              title="Fakultet"
              value={selectedStudent.faculty}
            />

            <InfoCard
              icon={Home}
              title="Studentski dom"
              value={selectedStudent.dorm}
            />
          </section>

          <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#10243A]">
              Dodaj / izmijeni obavezu
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Mjesec">
                <select
                  value={form.mjesec}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mjesec: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                >
                  {months.map((month) => (
                    <option
                      key={month}
                      value={month}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Godina">
                <input
                  type="number"
                  value={form.godina}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      godina: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                />
              </Field>

              <Field label="Iznos (€)">
                <input
                  type="number"
                  value={form.iznos}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      iznos: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                />
              </Field>

              <Field label="Uplaćeno (€)">
                <input
                  type="number"
                  value={form.uplaceno}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      uplaceno: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                />
              </Field>

              <Field label="Rok za uplatu">
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      due_date: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                />
              </Field>

              <Field label="Datum uplate">
                <input
                  type="date"
                  value={form.paid_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paid_at: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 font-semibold outline-none"
                />
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.boravi_u_domu}
                onChange={(e) =>
                  setForm({
                    ...form,
                    boravi_u_domu:
                      e.target.checked,
                  })
                }
              />

              <span className="text-sm font-semibold text-[#10243A]">
                Student boravi u domu
              </span>
            </div>

            {message && (
              <div className="mt-6 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
                {message}
              </div>
            )}

            <button
              onClick={saveObligation}
              className="mt-7 flex h-12 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white hover:bg-[#082d70]"
            >
              <Save size={18} />
              Sačuvaj obavezu
            </button>
          </section>

          <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#10243A]">
              Evidencija obaveza
            </h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe4f0]">
              <div className="grid grid-cols-6 bg-[#F8FBFF]">
                <Head text="Mjesec" />
                <Head text="Status" />
                <Head text="Iznos" />
                <Head text="Uplaćeno" />
                <Head text="Rok" />
                <Head text="Uplata" />
              </div>

              {obligations.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-6 border-t border-[#dbe4f0] bg-white"
                >
                  <Cell>
                    {item.mjesec} {item.godina}
                  </Cell>

                  <Cell>
                    <StatusBadge
                      status={item.status}
                    />
                  </Cell>

                  <Cell>
                    {item.iznos} €
                  </Cell>

                  <Cell>
                    {item.uplaceno} €
                  </Cell>

                  <Cell>
                    {formatDate(
                      item.due_date
                    )}
                  </Cell>

                  <Cell>
                    {formatDate(
                      item.paid_at
                    )}
                  </Cell>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </MainLayout>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3a8f]/10 text-[#0b3a8f]">
        <Icon size={22} />
      </div>

      <p className="text-sm font-semibold text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-[#10243A]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10243A]">
        {label}
      </label>

      {children}
    </div>
  );
}

function Head({
  text,
}) {
  return (
    <div className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
      {text}
    </div>
  );
}

function Cell({
  children,
}) {
  return (
    <div className="flex items-center border-l border-[#dbe4f0] px-4 py-4 text-sm font-semibold text-[#10243A] first:border-l-0">
      {children}
    </div>
  );
}

function StatusBadge({
  status,
}) {
  if (status === "paid") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
        <CheckCircle2 size={14} />
        Plaćeno
      </div>
    );
  }

  if (status === "inactive") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
        <Home size={14} />
        Ne boravi
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
      <XCircle size={14} />
      Neplaćeno
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "sr-Latn-ME",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

export default AdminDom;

import { useState } from "react";
import { Search, Save, Ticket } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";

function AdminMenzaBonovi() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/menza/admin/studenti?search=${search}`);

      const normalized = (res.data.students || []).map((s) => ({
        ...s,
        dorucak: Math.max(0, Number(s.dorucak) || 0),
        rucak: Math.max(0, Number(s.rucak) || 0),
        vecera: Math.max(0, Number(s.vecera) || 0),
      }));

      setStudents(normalized);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri pretrazi.");
    }
  };

  const updateBonovi = async (student) => {
    try {
      const res = await api.put(`/menza/admin/bonovi/${student.id}`, {
        dorucak: Number(student.dorucak || 0),
        rucak: Number(student.rucak || 0),
        vecera: Number(student.vecera || 0),
      });

      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri čuvanju bonova.");
    }
  };

  const changeValue = (id, field, value) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN MENZA
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Bonovi studenata
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Pretraži studenta i ažuriraj broj bonova za doručak, ručak i večeru.
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži po imenu, emailu, fakultetu ili indeksu..."
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

        {message && (
          <div className="mt-5 rounded-2xl bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
            {message}
          </div>
        )}
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-[#dbe4f0]">
          <div className="grid grid-cols-[1.4fr_1fr_120px_120px_120px_120px] bg-[#F8FBFF]">
            <Head text="Student" />
            <Head text="Fakultet / indeks" />
            <Head text="Doručak" />
            <Head text="Ručak" />
            <Head text="Večera" />
            <Head text="" />
          </div>

          {students.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Nema rezultata. Pretraži studenta.
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-[1.4fr_1fr_120px_120px_120px_120px] border-t border-[#dbe4f0] bg-white"
              >
                <Cell>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={student.name}
                      src={student.profile_image_url}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#10243A]">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </Cell>

                <Cell>
                  <div>
                    <p className="text-sm font-semibold text-[#10243A]">
                      {student.faculty}
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.index_number}
                    </p>
                  </div>
                </Cell>

                <Cell>
                  <BonInput
                    value={student.dorucak}
                    onChange={(value) =>
                      changeValue(student.id, "dorucak", value)
                    }
                  />
                </Cell>

                <Cell>
                  <BonInput
                    value={student.rucak}
                    onChange={(value) =>
                      changeValue(student.id, "rucak", value)
                    }
                  />
                </Cell>

                <Cell>
                  <BonInput
                    value={student.vecera}
                    onChange={(value) =>
                      changeValue(student.id, "vecera", value)
                    }
                  />
                </Cell>

                <Cell>
                  <button
                    onClick={() => updateBonovi(student)}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3a8f] px-4 text-xs font-bold text-white hover:bg-[#082d70]"
                  >
                    <Save size={15} />
                    Sačuvaj
                  </button>
                </Cell>
              </div>
            ))
          )}
        </div>
      </section>
    </MainLayout>
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
    <div className="flex items-center border-l border-[#dbe4f0] p-4 first:border-l-0">
      {children}
    </div>
  );
}

function BonInput({ value, onChange }) {
  return (
    <div className="relative">
      <Ticket
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
      />

      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange("");
          const n = Number(raw);
          if (Number.isNaN(n)) return;
          onChange(Math.max(0, n));
        }}
        onKeyDown={(e) => {
          if (e.key === "-" || e.key === "e") e.preventDefault();
        }}
        className="h-10 w-full rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] pl-9 pr-3 text-sm font-bold outline-none focus:border-[#0b3a8f]"
      />
    </div>
  );
}

export default AdminMenzaBonovi;

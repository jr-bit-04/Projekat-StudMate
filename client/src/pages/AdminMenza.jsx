import { useEffect, useState } from "react";
import { CalendarDays, Coffee, Moon, Plus, Save, Soup, Trash2 } from "lucide-react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";

const meals = [
  { key: "dorucak", label: "Doručak", icon: Coffee },
  { key: "rucak", label: "Ručak", icon: Soup },
  { key: "vecera", label: "Večera", icon: Moon },
];

function AdminMenza() {
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMeal, setSelectedMeal] = useState("dorucak");
  const [menus, setMenus] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const [message, setMessage] = useState("");

  const [breakfastRows, setBreakfastRows] = useState([
    { naziv: "", bonovi: "", cijena: "" },
  ]);

  const [mealRows, setMealRows] = useState({
    glavna_jela: [""],
    prilozi: [""],
    salate: [""],
    dodatno: [""],
  });

  useEffect(() => {
    fetchMenus();
  }, [datum]);

  useEffect(() => {
    loadSelectedMeal();
  }, [menus, selectedMeal]);

  const fetchMenus = async () => {
    try {
      const res = await api.get(`/menza/admin/meni?datum=${datum}`);
      setMenus(res.data.meni || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri učitavanju menija.");
    }
  };

  const loadSelectedMeal = () => {
    const existing = menus.find((item) => item.tip_obroka === selectedMeal);

    if (!existing) {
      setCurrentMenuId(null);
      setBreakfastRows([{ naziv: "", bonovi: "", cijena: "" }]);
      setMealRows({
        glavna_jela: [""],
        prilozi: [""],
        salate: [""],
        dodatno: [""],
      });
      return;
    }

    setCurrentMenuId(existing.id);

    setBreakfastRows(
      existing.dorucak_stavke?.length
        ? existing.dorucak_stavke
        : [{ naziv: "", bonovi: "", cijena: "" }]
    );

    setMealRows({
      glavna_jela: existing.glavna_jela?.length ? existing.glavna_jela : [""],
      prilozi: existing.prilozi?.length ? existing.prilozi : [""],
      salate: existing.salate?.length ? existing.salate : [""],
      dodatno: existing.dodatno?.length ? existing.dodatno : [""],
    });
  };

  const saveMenu = async () => {
    setMessage("");

    const payload = {
      datum,
      tip_obroka: selectedMeal,
      aktivan: true,
      dorucak_stavke:
        selectedMeal === "dorucak"
          ? breakfastRows
              .filter((item) => item.naziv.trim())
              .map((item) => ({
                naziv: item.naziv.trim(),
                bonovi: Number(item.bonovi || 0),
                cijena: item.cijena.trim(),
              }))
          : [],
      glavna_jela: selectedMeal !== "dorucak" ? cleanArray(mealRows.glavna_jela) : [],
      prilozi: selectedMeal !== "dorucak" ? cleanArray(mealRows.prilozi) : [],
      salate: selectedMeal !== "dorucak" ? cleanArray(mealRows.salate) : [],
      dodatno: selectedMeal !== "dorucak" ? cleanArray(mealRows.dodatno) : [],
    };

    try {
      if (currentMenuId) {
        await api.put(`/menza/admin/meni/${currentMenuId}`, payload);
        setMessage("Meni je uspješno izmijenjen.");
      } else {
        await api.post("/menza/admin/meni", payload);
        setMessage("Meni je uspješno dodat.");
      }

      fetchMenus();
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || "Greška pri čuvanju menija.");
    }
  };

  const deleteMenu = async () => {
    if (!currentMenuId) return;
    if (!window.confirm("Obrisati meni za ovaj obrok?")) return;

    try {
      await api.delete(`/menza/admin/meni/${currentMenuId}`);
      setMessage("Meni je obrisan.");
      fetchMenus();
    } catch (error) {
      setMessage(error.response?.data?.message || "Greška pri brisanju menija.");
    }
  };

  return (
    <MainLayout>
      <section className="rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b3a8f]">
          ADMIN MENZA
        </p>

        <h1 className="mt-3 text-[34px] font-bold text-[#10243A]">
          Upravljanje menijem
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Izaberi datum i obrok, pa direktno dodaj ili izmijeni postojeći meni.
        </p>
      </section>

      <section className="mt-7 rounded-[22px] border border-[#dbe4f0] bg-white p-8 shadow-sm">
        <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#10243A]">
              Datum
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b3a8f]"
              />

              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#10243A]">
              Obrok
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {meals.map((meal) => {
                const Icon = meal.icon;
                const active = selectedMeal === meal.key;

                return (
                  <button
                    key={meal.key}
                    type="button"
                    onClick={() => setSelectedMeal(meal.key)}
                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition ${
                      active
                        ? "border-[#0b3a8f] bg-[#0b3a8f] text-white"
                        : "border-[#dbe4f0] bg-[#F8FBFF] text-[#0b3a8f] hover:bg-white"
                    }`}
                  >
                    <Icon size={17} />
                    {meal.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-[#dbe4f0] bg-[#F8FBFF] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#10243A]">
                {getMealLabel(selectedMeal)} - {formatDate(datum)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {currentMenuId
                  ? "Meni za ovaj datum već postoji. Možeš ga izmijeniti ili obrisati."
                  : "Meni za ovaj obrok još nije dodat. Popuni tabelu i sačuvaj."}
              </p>
            </div>

            {currentMenuId && (
              <span className="rounded-full bg-[#0b3a8f]/10 px-4 py-2 text-xs font-bold text-[#0b3a8f]">
                Postojeći meni
              </span>
            )}
          </div>
        </div>

        {selectedMeal === "dorucak" ? (
          <BreakfastTable rows={breakfastRows} setRows={setBreakfastRows} />
        ) : (
          <LunchDinnerTable rows={mealRows} setRows={setMealRows} />
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-[#dbe4f0] bg-[#0b3a8f]/10 p-4 text-sm font-bold text-[#0b3a8f]">
            {message}
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveMenu}
            className="flex h-12 items-center gap-2 rounded-2xl bg-[#0b3a8f] px-6 text-sm font-bold text-white transition hover:bg-[#082d70]"
          >
            <Save size={18} />
            {currentMenuId ? "Sačuvaj izmjene" : "Dodaj meni"}
          </button>

          {currentMenuId && (
            <button
              type="button"
              onClick={deleteMenu}
              className="flex h-12 items-center gap-2 rounded-2xl bg-red-50 px-6 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={18} />
              Obriši meni
            </button>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

function BreakfastTable({ rows, setRows }) {
  const updateRow = (index, field, value) => {
    const copy = [...rows];
    copy[index][field] = value;
    setRows(copy);
  };

  const addRow = () => {
    setRows([...rows, { naziv: "", bonovi: "", cijena: "" }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-[#dbe4f0]">
      <div className="grid grid-cols-[1fr_120px_140px_70px] bg-[#F8FBFF]">
        <TableHead text="Sendviči, peciva, kolači" />
        <TableHead text="Bonovi" />
        <TableHead text="Cijena" />
        <TableHead text="" />
      </div>

      {rows.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_120px_140px_70px] border-t border-[#dbe4f0] bg-white"
        >
          <TableCell>
            <input
              value={item.naziv}
              onChange={(e) => updateRow(index, "naziv", e.target.value)}
              placeholder="Sendvič sa čajnom + jogurt"
              className="h-11 w-full rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </TableCell>

          <TableCell>
            <input
              type="number"
              value={item.bonovi}
              onChange={(e) => updateRow(index, "bonovi", e.target.value)}
              placeholder="2"
              className="h-11 w-full rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </TableCell>

          <TableCell>
            <input
              value={item.cijena}
              onChange={(e) => updateRow(index, "cijena", e.target.value)}
              placeholder="1.20€"
              className="h-11 w-full rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
            />
          </TableCell>

          <TableCell>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
            >
              <Trash2 size={17} />
            </button>
          </TableCell>
        </div>
      ))}

      <div className="border-t border-[#dbe4f0] bg-white p-4">
        <button
          type="button"
          onClick={addRow}
          className="flex h-11 items-center gap-2 rounded-2xl bg-[#0b3a8f]/10 px-5 text-sm font-bold text-[#0b3a8f] hover:bg-[#0b3a8f]/15"
        >
          <Plus size={17} />
          Dodaj stavku
        </button>
      </div>
    </div>
  );
}

function LunchDinnerTable({ rows, setRows }) {
  const sections = [
    { key: "glavna_jela", title: "Glavna jela" },
    { key: "prilozi", title: "Prilozi" },
    { key: "salate", title: "Salate" },
    { key: "dodatno", title: "Dodatno" },
  ];

  const updateValue = (key, index, value) => {
    const copy = { ...rows };
    copy[key][index] = value;
    setRows(copy);
  };

  const addValue = (key) => {
    setRows({
      ...rows,
      [key]: [...rows[key], ""],
    });
  };

  const removeValue = (key, index) => {
    setRows({
      ...rows,
      [key]: rows[key].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-[#dbe4f0]">
      <div className="grid md:grid-cols-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className="border-t border-[#dbe4f0] bg-white p-5 md:border-r md:border-t-0 last:border-r-0"
          >
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f]">
              {section.title}
            </h3>

            <div className="grid gap-3">
              {rows[section.key].map((value, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={value}
                    onChange={(e) =>
                      updateValue(section.key, index, e.target.value)
                    }
                    placeholder={section.title}
                    className="h-11 flex-1 rounded-xl border border-[#dbe4f0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#0b3a8f]"
                  />

                  <button
                    type="button"
                    onClick={() => removeValue(section.key, index)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addValue(section.key)}
              className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-[#0b3a8f]/10 px-4 text-sm font-bold text-[#0b3a8f] hover:bg-[#0b3a8f]/15"
            >
              <Plus size={16} />
              Dodaj
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-[#dbe4f0] bg-[#F8FBFF] px-7 py-5 text-sm font-semibold text-slate-600">
        Glavno jelo + prilog + salata + dodatno = 1 bon.
      </div>
    </div>
  );
}

function TableHead({ text }) {
  return (
    <div className="border-l border-[#dbe4f0] px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#0b3a8f] first:border-l-0">
      {text}
    </div>
  );
}

function TableCell({ children }) {
  return (
    <div className="flex items-center border-l border-[#dbe4f0] p-3 first:border-l-0">
      {children}
    </div>
  );
}

function cleanArray(array) {
  return array.map((item) => String(item).trim()).filter(Boolean);
}

function getMealLabel(key) {
  if (key === "dorucak") return "Doručak";
  if (key === "rucak") return "Ručak";
  return "Večera";
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("sr-Latn-ME", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default AdminMenza;

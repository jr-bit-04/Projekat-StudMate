import { Bell, Search } from "lucide-react";

function Topbar() {
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-[28px] font-black tracking-[-0.04em] text-[#10243a]">
          Dobrodošla, {user?.name?.split(" ")[0] || "Student"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Sve studentske informacije na jednom mjestu.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Pretraga..."
            className="h-11 w-[250px] rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#0b3a8f]"
          />
        </div>

        <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Bell size={20} className="text-slate-700" />

          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;

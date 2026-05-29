import { NavLink } from "react-router-dom";
import { LogOut, User, Users } from "lucide-react";
import { navigation, getGlobalAdminGroups } from "../../data/navigation";
import ucgLogo from "../../assets/ucg-logo.png";

function Sidebar() {
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const isGlobalAdmin =
    user?.role === "admin" && user?.admin_module === "all";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const visibleNavigation = navigation.filter((item) => {
    if (!user) return false;
    if (!item.roles?.includes(user.role)) return false;

    if (user.role === "admin") {
      return item.module === user.admin_module;
    }

    return true;
  });

  return (
    <aside className="hidden h-screen w-[280px] border-r border-white/10 bg-[#0b3a8f]/82 px-5 py-6 text-white shadow-[20px_0_60px_rgba(0,0,0,0.16)] backdrop-blur-md lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img src={ucgLogo} alt="UCG" className="h-12 w-12 object-contain" />

        <div>
          <h1 className="text-xl font-black text-white">StudMate</h1>
          <p className="text-xs font-medium text-blue-100">
            Univerzitet Crne Gore
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {isGlobalAdmin ? (
          <>
            {getGlobalAdminGroups().map((group) => (
              <div key={group.module} className="flex flex-col gap-1">
                <p className="px-4 pb-1 pt-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">
                  {group.label}
                </p>

                {group.items.map((item) => (
                  <SidebarLink key={item.path} item={item} />
                ))}
              </div>
            ))}

            <p className="px-4 pb-1 pt-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">
              Sistem
            </p>

            <SidebarLink
              item={{ title: "Korisnici", path: "/admin/korisnici", icon: Users }}
            />

            <SidebarLink
              item={{ title: "Profil", path: "/profil", icon: User }}
            />
          </>
        ) : (
          visibleNavigation.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))
        )}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
        <p className="text-sm font-black text-white">
          {user?.name || "Korisnik"}
        </p>

        <p className="mt-1 truncate text-xs text-blue-100">
          {user?.email || "user@ucg.ac.me"}
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/12 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
        >
          <LogOut size={18} />
          Odjava
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          isActive
            ? "bg-white text-[#0b3a8f] shadow-lg"
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <Icon size={20} />
      {item.title}
    </NavLink>
  );
}

export default Sidebar;

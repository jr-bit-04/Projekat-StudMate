import { NavLink } from "react-router-dom";
import { LogOut, User, Users } from "lucide-react";

import { navigation, getGlobalAdminFlat } from "../../data/navigation";
import useStoredUser from "../../hooks/useStoredUser";
import { clearStoredAuth } from "../../utils/authStorage";

function MobileNav() {
  const user = useStoredUser();

  const isGlobalAdmin =
    user?.role === "admin" && user?.admin_module === "all";

  const visibleNavigation = isGlobalAdmin
    ? [
        ...getGlobalAdminFlat(),
        { title: "Korisnici", path: "/admin/korisnici", icon: Users },
        { title: "Profil", path: "/profil", icon: User },
      ]
    : navigation.filter((item) => {
        if (!user) return false;
        if (!item.roles?.includes(user.role)) return false;

        if (user.role === "admin") {
          return item.module === user.admin_module;
        }

        return true;
      });

  const handleLogout = () => {
    clearStoredAuth();
    window.location.href = "/login";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="flex min-w-0 gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-bold transition sm:min-w-[78px] sm:text-[11px] ${
                  isActive
                    ? "bg-[#0b3a8f] text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-1 max-w-full truncate">{item.title}</span>
            </NavLink>
          );
        })}

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-bold text-red-500 transition hover:bg-red-50 sm:min-w-[78px] sm:text-[11px]"
          >
            <LogOut size={20} />
            <span className="mt-1 max-w-full truncate">Odjava</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default MobileNav;

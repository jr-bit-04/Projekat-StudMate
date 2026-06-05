import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  Building2,
  ChevronDown,
  GraduationCap,
  LogOut,
  Percent,
  Settings,
  UtensilsCrossed,
  User,
  Users,
} from "lucide-react";

import { navigation, getGlobalAdminGroups } from "../../data/navigation";
import useStoredUser from "../../hooks/useStoredUser";
import { clearStoredAuth } from "../../utils/authStorage";
import ucgLogo from "../../assets/ucg-logo.png";
import Avatar from "../ui/Avatar";

function Sidebar() {
  const user = useStoredUser();

  const isGlobalAdmin =
    user?.role === "admin" && user?.admin_module === "all";

  const handleLogout = () => {
    clearStoredAuth();
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
    <aside className="hidden min-h-screen w-[280px] self-stretch border-r border-white/10 bg-[#0b3a8f]/82 px-5 py-6 text-white shadow-[20px_0_60px_rgba(0,0,0,0.16)] backdrop-blur-md lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img src={ucgLogo} alt="UCG" className="h-12 w-12 object-contain" />

        <div>
          <h1 className="text-xl font-black text-white">StudMate</h1>
          <p className="text-xs font-medium text-blue-100">
            Univerzitet Crne Gore
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 pr-1">
        {isGlobalAdmin ? (
          <GlobalAdminNavigation />
        ) : (
          visibleNavigation.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))
        )}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.name}
            src={user?.profile_image_url}
            size="md"
            className="border border-white/25"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              {user?.name || "Korisnik"}
            </p>

            <p className="mt-1 truncate text-xs text-blue-100">
              {user?.email || "user@ucg.ac.me"}
            </p>
          </div>
        </div>

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

const globalAdminIcons = {
  menza: UtensilsCrossed,
  dom: Building2,
  citaona: BookOpen,
  popusti: Percent,
  stipendije: GraduationCap,
  sistem: Settings,
};

function GlobalAdminNavigation() {
  const location = useLocation();
  const groups = [
    ...getGlobalAdminGroups(),
    {
      module: "sistem",
      label: "Sistem",
      items: [
        { title: "Korisnici", path: "/admin/korisnici", icon: Users },
        { title: "Profil", path: "/profil", icon: User },
      ],
    },
  ];

  const activeModule =
    groups.find((group) =>
      group.items.some((item) => location.pathname === item.path)
    )?.module || null;

  const [openModule, setOpenModule] = useState(activeModule);

  return groups.map((group) => {
    const Icon = globalAdminIcons[group.module];
    const isOpen = openModule === group.module;
    const isActive = activeModule === group.module;

    return (
      <div key={group.module} className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() =>
            setOpenModule((current) =>
              current === group.module ? null : group.module
            )
          }
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
            isActive
              ? "bg-white text-[#0b3a8f] shadow-lg"
              : isOpen
                ? "bg-white/15 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
          aria-expanded={isOpen}
        >
          <Icon size={20} />
          <span className="flex-1">{group.label}</span>
          <ChevronDown
            size={17}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="ml-5 flex flex-col gap-1 border-l border-white/20 pl-3">
            {group.items.map((item) => (
              <SidebarLink key={item.path} item={item} nested />
            ))}
          </div>
        )}
      </div>
    );
  });
}

function SidebarLink({ item, nested = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${
          nested ? "py-2.5" : "py-3"
        } ${
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

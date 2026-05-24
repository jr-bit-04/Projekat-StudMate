import { NavLink } from "react-router-dom";
import { navigation } from "../../data/navigation";

function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
                  isActive
                    ? "bg-[#0b3a8f] text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-1">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;

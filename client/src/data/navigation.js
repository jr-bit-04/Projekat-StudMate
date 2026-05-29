import {
  LayoutDashboard, House, UtensilsCrossed, BookOpen,
  Percent, GraduationCap, User, Bell,
  Building2, Ticket, ShieldCheck,
} from "lucide-react";

export const navigation = [

  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["student"] },
  { title: "Dom", path: "/dom", icon: House, roles: ["student"] },
  { title: "Menza", path: "/menza", icon: UtensilsCrossed, roles: ["student"] },
  { title: "Čitaonica", path: "/citaona", icon: BookOpen, roles: ["student"] },
  { title: "Popusti", path: "/popusti", icon: Percent, roles: ["student"] },
  { title: "Stipendije", path: "/stipendije", icon: GraduationCap, roles: ["student"] },
  { title: "Profil", path: "/profil", icon: User, roles: ["student"] },

  { title: "Menza", path: "/admin/menza", icon: UtensilsCrossed, roles: ["admin"], module: "menza" },
  { title: "Bonovi studenata", path: "/admin/menza/bonovi", icon: Ticket, roles: ["admin"], module: "menza" },
  { title: "Obavještenja", path: "/admin/menza/obavjestenja", icon: Bell, roles: ["admin"], module: "menza" },
  { title: "Profil", path: "/profil", icon: User, roles: ["admin"], module: "menza" },

  { title: "Dom", path: "/admin/dom", icon: Building2, roles: ["admin"], module: "dom" },
  { title: "Obavještenja", path: "/admin/dom/obavjestenja", icon: Bell, roles: ["admin"], module: "dom" },
  { title: "Profil", path: "/profil", icon: User, roles: ["admin"], module: "dom" },

  { title: "Čitaonica", path: "/admin/citaona", icon: BookOpen, roles: ["admin"], module: "citaona" },
  { title: "Profil", path: "/profil", icon: User, roles: ["admin"], module: "citaona" },

  { title: "Moderacija popusta", path: "/admin/popusti/moderacija", icon: ShieldCheck, roles: ["admin"], module: "popusti" },
  { title: "Profil", path: "/profil", icon: User, roles: ["admin"], module: "popusti" },

  { title: "Stipendije", path: "/admin/stipendije", icon: GraduationCap, roles: ["admin"], module: "stipendije" },
  { title: "Krediti", path: "/admin/krediti", icon: Percent, roles: ["admin"], module: "stipendije" },
  { title: "Profil", path: "/profil", icon: User, roles: ["admin"], module: "stipendije" },

];

export const adminModuleOrder = ["menza", "dom", "citaona", "popusti", "stipendije"];

export const adminModuleLabels = {
  menza: "Menza",
  dom: "Dom",
  citaona: "Čitaonica",
  popusti: "Popusti",
  stipendije: "Stipendije",
};

export function getGlobalAdminGroups() {
  return adminModuleOrder
    .map((module) => ({
      module,
      label: adminModuleLabels[module],
      items: navigation.filter(
        (item) =>
          item.roles?.includes("admin") &&
          item.module === module &&
          item.path !== "/profil"
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getGlobalAdminFlat() {
  const items = getGlobalAdminGroups().flatMap((group) =>
    group.items.map((item) => ({ ...item, moduleLabel: group.label }))
  );

  const titleCounts = items.reduce((acc, item) => {
    acc[item.title] = (acc[item.title] || 0) + 1;
    return acc;
  }, {});

  return items.map((item) =>
    titleCounts[item.title] > 1
      ? { ...item, title: `${item.title} (${item.moduleLabel})` }
      : item
  );
}
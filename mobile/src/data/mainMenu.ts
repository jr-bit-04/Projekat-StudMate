import { IconName } from "../components/AppIcon";

export interface MenuItem {
  label: string;
  route: string;
  icon: IconName;
  description?: string;
}

// Glavni studentski moduli (MainNavigator rute).
export const MAIN_MENU: MenuItem[] = [
  { label: "Početna", route: "Dashboard", icon: "dashboard", description: "Pregled svega" },
  { label: "Dom", route: "Dom", icon: "dom", description: "Obaveze i novosti" },
  { label: "Menza", route: "Menza", icon: "menza", description: "Meni i bonovi" },
  { label: "Čitaona", route: "Citaona", icon: "citaona", description: "Rezervacije mjesta" },
  { label: "Popusti", route: "Popusti", icon: "popusti", description: "Studentske pogodnosti" },
  { label: "Stipendije", route: "Stipendije", icon: "stipendije", description: "Konkursi i rokovi" },
  { label: "Profil", route: "Profil", icon: "profil", description: "Nalog i lozinka" },
];

// Administrativne rute (AdminNavigator).
export const ADMIN_MENU: MenuItem[] = [
  { label: "Svi sektori", route: "AdminHub", icon: "dashboard", description: "Admin panel" },
  { label: "Profil", route: "Profil", icon: "profil", description: "Nalog i lozinka" },
];

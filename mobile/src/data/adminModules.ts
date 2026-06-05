import { ImageSourcePropType } from "react-native";

import citaonaHero from "../assets/sections/citaona.jpg";
import domHero from "../assets/sections/dom.jpg";
import menzaHero from "../assets/sections/menza.jpg";
import popustiHero from "../assets/sections/popusti.png";
import stipendijeHero from "../assets/sections/stipendije.jpg";
import { AuthUser } from "../types/auth";

export type AdminManagedModule =
  | "menza"
  | "dom"
  | "citaona"
  | "popusti"
  | "stipendije";

export interface AdminModuleMeta {
  description: string;
  image: ImageSourcePropType;
  key: AdminManagedModule;
  label: string;
  subtitle: string;
  tasks: string[];
}

export const ADMIN_MODULES: AdminModuleMeta[] = [
  {
    key: "menza",
    label: "Menza",
    description: "Meni, bonovi i obavještenja za studentsku menzu.",
    subtitle: "Upravljanje menijem, bonovima i obavještenjima menze.",
    image: menzaHero,
    tasks: [
      "Dodavanje i izmjena dnevnog menija.",
      "Pregled i kontrola bonova studenata.",
      "Objava obavještenja vezanih za menzu.",
    ],
  },
  {
    key: "dom",
    label: "Dom",
    description: "Studenti doma, njihove obaveze i servisne informacije.",
    subtitle: "Pregled studenata, obaveza i obavještenja doma.",
    image: domHero,
    tasks: [
      "Pretraga i evidencija studenata u domu.",
      "Unos, izmjena i pregled mjesečnih obaveza.",
      "Objava obavještenja za dom.",
    ],
  },
  {
    key: "citaona",
    label: "Čitaonica",
    description: "Rezervacije mjesta, potvrda kodova i evidencija prisustva.",
    subtitle: "Kontrola rezervacija i rada čitaonice.",
    image: citaonaHero,
    tasks: [
      "Potvrda rezervacije pri ulasku studenta.",
      "Pregled aktivnih i čekajućih rezervacija.",
      "Zauzimanje mjesta za studente bez prethodne rezervacije.",
    ],
  },
  {
    key: "popusti",
    label: "Popusti",
    description: "Moderacija partnerskih promocija i odobravanje ponuda.",
    subtitle: "Pregled, odobravanje i odbijanje popusta.",
    image: popustiHero,
    tasks: [
      "Moderacija pristiglih partnerskih promocija.",
      "Pregled statusa odobrenih i odbijenih ponuda.",
      "Kontrola partnerskih i API promocija.",
    ],
  },
  {
    key: "stipendije",
    label: "Stipendije",
    description: "Konkursi za stipendije i kredite sa rokovima i uslovima.",
    subtitle: "Upravljanje konkursima za stipendije i kredite.",
    image: stipendijeHero,
    tasks: [
      "Dodavanje novih konkursa i kredita.",
      "Izmjena rokova, iznosa i uslova prijave.",
      "Upravljanje aktivnim i neaktivnim konkursima.",
    ],
  },
];

export function isAdminManagedModule(
  value: string | null | undefined
): value is AdminManagedModule {
  return ADMIN_MODULES.some((item) => item.key === value);
}

export function getAdminModuleMeta(module: AdminManagedModule) {
  return ADMIN_MODULES.find((item) => item.key === module) || ADMIN_MODULES[0];
}

export function getAccessibleAdminModules(user?: AuthUser | null) {
  if (!user || user.role !== "admin") {
    return [] as AdminManagedModule[];
  }

  if (user.admin_module === "all") {
    return ADMIN_MODULES.map((item) => item.key);
  }

  if (isAdminManagedModule(user.admin_module)) {
    return [user.admin_module];
  }

  return [] as AdminManagedModule[];
}

export function getDefaultAdminModule(user?: AuthUser | null) {
  return getAccessibleAdminModules(user)[0] || null;
}

import { AdminManagedModule } from "../data/adminModules";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Citaona: undefined;
  Menza: undefined;
  Dom: undefined;
  Popusti: undefined;
  Stipendije: undefined;
  Profil: undefined;
};

export type AdminStackParamList = {
  AdminHub: undefined;
  AdminModule: {
    module: AdminManagedModule;
  };
  Profil: undefined;
};

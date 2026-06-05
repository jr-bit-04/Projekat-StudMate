import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { StyleProp, TextStyle } from "react-native";

import { colors } from "../theme/colors";

export type IconName =
  | "dashboard"
  | "dom"
  | "menza"
  | "citaona"
  | "popusti"
  | "stipendije"
  | "info"
  | "profil"
  | "mail"
  | "lock"
  | "user"
  | "faculty"
  | "admin"
  | "index"
  | "arrow-right"
  | "chevron-down"
  | "back"
  | "logout"
  | "bell"
  | "ticket"
  | "menu"
  | "close";

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function AppIcon({
  name,
  size = 20,
  color = colors.primary,
  style,
}: AppIconProps) {
  const common = { size, color, style };

  switch (name) {
    case "dashboard":
      return <Feather name="grid" {...common} />;
    case "dom":
      return <Feather name="home" {...common} />;
    case "menza":
      return <MaterialCommunityIcons name="silverware-fork-knife" {...common} />;
    case "citaona":
      return <Feather name="book-open" {...common} />;
    case "popusti":
      return <Feather name="percent" {...common} />;
    case "stipendije":
      return <Ionicons name="school-outline" {...common} />;
    case "info":
      return <Feather name="info" {...common} />;
    case "profil":
    case "user":
      return <Feather name="user" {...common} />;
    case "mail":
      return <Feather name="mail" {...common} />;
    case "lock":
      return <Feather name="lock" {...common} />;
    case "faculty":
      return <Ionicons name="business-outline" {...common} />;
    case "admin":
      return <Feather name="shield" {...common} />;
    case "index":
      return <Feather name="hash" {...common} />;
    case "arrow-right":
      return <Feather name="arrow-right" {...common} />;
    case "chevron-down":
      return <Feather name="chevron-down" {...common} />;
    case "back":
      return <Feather name="chevron-left" {...common} />;
    case "logout":
      return <Feather name="log-out" {...common} />;
    case "bell":
      return <Feather name="bell" {...common} />;
    case "ticket":
      return <MaterialCommunityIcons name="ticket-percent-outline" {...common} />;
    case "menu":
      return <Feather name="menu" {...common} />;
    case "close":
      return <Feather name="x" {...common} />;
    default:
      return <Feather name="circle" {...common} />;
  }
}

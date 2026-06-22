import { Appearance } from "react-native";

Appearance.setColorScheme("dark");

/** App always uses dark mode. */
export function useColorScheme(): "dark" {
  return "dark";
}

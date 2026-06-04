import type { Dictionary } from "@/src/i18n";

export function getHomeGreeting(home: Dictionary["home"]): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return home.greetingMorning;
  }
  if (hour < 17) {
    return home.greetingAfternoon;
  }
  if (hour < 22) {
    return home.greetingEvening;
  }
  return home.greetingNight;
}

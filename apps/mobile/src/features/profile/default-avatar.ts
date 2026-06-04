/** Stable placeholder portrait when the user has not set an avatar yet. */
export function getDefaultAvatarUri(seed: string, size = 96): string {
  const normalized = seed.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "guest";
  return `https://picsum.photos/seed/expense-avatar-${normalized}/${size}/${size}`;
}

/** True when `updated_at` falls on the device's local calendar day. */
export function isHousingUpdatedToday(
  updatedAt: string | null | undefined,
): boolean {
  if (!updatedAt) {
    return false;
  }
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) {
    return false;
  }
  const now = new Date();
  return (
    updated.getFullYear() === now.getFullYear() &&
    updated.getMonth() === now.getMonth() &&
    updated.getDate() === now.getDate()
  );
}

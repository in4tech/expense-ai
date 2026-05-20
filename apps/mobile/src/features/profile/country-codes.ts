import { all, findOne } from 'country-codes-list';

export type CountryCodeOption = {
  iso: string;
  dial: string;
  label: string;
};

function formatDial(callingCode: string): string {
  const trimmed = callingCode.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export const COUNTRY_CODES: CountryCodeOption[] = all()
  .map((country) => {
    const dial = formatDial(country.countryCallingCode);
    return {
      iso: country.countryCode,
      dial,
      label: `${country.countryNameEn} (${dial})`,
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

export function getCountryDial(iso: string): string {
  const row = findOne('countryCode', iso.toUpperCase());
  return row ? formatDial(row.countryCallingCode) : '+84';
}

/** Maps legacy dial strings (e.g. "+84") or ISO codes to a country ISO. */
export function resolveCountryIso(stored: string | undefined): string {
  if (!stored) {
    return 'VN';
  }
  if (stored.startsWith('+')) {
    const match = all().find((c) => formatDial(c.countryCallingCode) === stored);
    return match?.countryCode ?? 'VN';
  }
  if (stored.length === 2) {
    return stored.toUpperCase();
  }
  return 'VN';
}

import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY = "US";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export type PhoneCountry = { code: CountryCode; name: string; dial: string };

const COUNTRY_CODES = new Set<string>(getCountries());

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return !!value && COUNTRY_CODES.has(value.toUpperCase());
}

function countryName(code: CountryCode) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export const PHONE_COUNTRIES: PhoneCountry[] = [...getCountries()]
  .map((code) => ({ code, name: countryName(code), dial: `+${getCountryCallingCode(code)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function countryDial(country: string | null | undefined) {
  const code = (isCountryCode(country) ? country : DEFAULT_PHONE_COUNTRY).toUpperCase() as CountryCode;
  return `+${getCountryCallingCode(code)}`;
}

export function formatPhone(value: string, country: string | null | undefined = DEFAULT_PHONE_COUNTRY) {
  const code = (isCountryCode(country) ? country : DEFAULT_PHONE_COUNTRY).toUpperCase() as CountryCode;
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (code === "US" || code === "CA") {
    const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    const number = national.slice(0, 10);
    if (number.length <= 3) return number;
    if (number.length <= 6) return `${number.slice(0, 3)}-${number.slice(3)}`;
    return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  }
  try {
    const formatted = new AsYouType(code).input(value);
    return formatted || digits;
  } catch {
    return value.trim();
  }
}

export function nationalDigits(value: string, country: string | null | undefined = DEFAULT_PHONE_COUNTRY) {
  const code = (isCountryCode(country) ? country : DEFAULT_PHONE_COUNTRY).toUpperCase() as CountryCode;
  try {
    const parsed = parsePhoneNumberFromString(value, code);
    return parsed?.nationalNumber ?? value.replace(/\D/g, "");
  } catch {
    return value.replace(/\D/g, "");
  }
}

export function parsePhone(value: string, fallbackCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY) {
  const fallback = (isCountryCode(fallbackCountry) ? fallbackCountry : DEFAULT_PHONE_COUNTRY).toUpperCase() as CountryCode;
  try {
    const parsed = parsePhoneNumberFromString(value.trim(), fallback);
    if (parsed) {
      const country = parsed.country ?? fallback;
      return { number: formatPhone(parsed.nationalNumber, country), country };
    }
  } catch {
    // fall through to a basic format
  }
  return { number: formatPhone(value, fallback), country: fallback };
}

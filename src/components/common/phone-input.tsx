"use client";

import { useState } from "react";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, formatPhone, isCountryCode } from "@/lib/phone";

export default function PhoneInput({
  countryName,
  numberName,
  defaultCountry,
  defaultNumber,
  className,
  inputClassName,
  selectClassName,
  required,
}: {
  countryName: string;
  numberName: string;
  defaultCountry?: string | null;
  defaultNumber?: string | null;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  required?: boolean;
}) {
  const initialCountry = isCountryCode(defaultCountry) ? defaultCountry.toUpperCase() : DEFAULT_PHONE_COUNTRY;
  const [country, setCountry] = useState(initialCountry);
  const [number, setNumber] = useState(() => formatPhone(defaultNumber ?? "", initialCountry));

  function changeCountry(next: string) {
    setCountry(next);
    setNumber((current) => formatPhone(current, next));
  }

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      <select name={countryName} value={country} onChange={(event) => changeCountry(event.target.value)} aria-label="Country calling code" className={selectClassName}>
        {PHONE_COUNTRIES.map((option) => <option key={option.code} value={option.code}>{option.code} {option.dial}</option>)}
      </select>
      <input type="tel" inputMode="tel" name={numberName} value={number} onChange={(event) => setNumber(formatPhone(event.target.value, country))} required={required} maxLength={40} className={inputClassName} />
    </div>
  );
}

"use client";

import { useState, type ChangeEvent } from "react";
import type { Venue } from "@prisma/client";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-slate-700";

type VenueAddress = Pick<Venue, "address" | "address2" | "city" | "state" | "postalCode" | "country">;

function AddressField({
  name,
  label,
  value,
  maxLength = 2000,
  onChange,
}: {
  name: keyof VenueAddress;
  label: string;
  value: string;
  maxLength?: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input name={name} value={value} maxLength={maxLength} onChange={onChange} className={inputClass} />
    </label>
  );
}

export default function VenueAddressFields({ venue }: { venue?: VenueAddress }) {
  const [address, setAddress] = useState({
    address: venue?.address ?? "",
    address2: venue?.address2 ?? "",
    city: venue?.city ?? "",
    state: venue?.state ?? "",
    postalCode: venue?.postalCode ?? "",
    country: venue?.country ?? "",
  });
  const location = Object.values(address).filter(Boolean).join(", ");

  function updateAddress(event: ChangeEvent<HTMLInputElement>) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <>
      <AddressField name="address" label="Address" value={address.address} onChange={updateAddress} />
      <AddressField name="address2" label="Address 2" value={address.address2} onChange={updateAddress} />
      <AddressField name="city" label="City" value={address.city} maxLength={120} onChange={updateAddress} />
      <AddressField name="state" label="State / Province" value={address.state} maxLength={120} onChange={updateAddress} />
      <AddressField name="postalCode" label="ZIP / Postal code" value={address.postalCode} maxLength={32} onChange={updateAddress} />
      <AddressField name="country" label="Country" value={address.country} maxLength={120} onChange={updateAddress} />
      <div className="sm:col-span-2">
        <h3 className="text-sm font-medium text-slate-700">Map preview</h3>
        {location ? (
          <iframe
            title={`Map showing ${location}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-2 h-64 w-full rounded-xl border border-slate-200"
          />
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Enter an address to preview the venue location.
          </p>
        )}
      </div>
    </>
  );
}

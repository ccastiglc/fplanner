"use client";

import { useState, type ChangeEvent } from "react";
import type { Venue } from "@prisma/client";

const inputClass = "ui-input mt-1.5";
const labelClass = "ui-label";

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
        <h3 className="text-sm font-medium text-foreground">Map preview</h3>
        {location ? (
          <iframe
            title={`Map showing ${location}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-2 h-64 w-full rounded-lg border border-border"
          />
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Enter an address to preview the venue location.
          </p>
        )}
      </div>
    </>
  );
}

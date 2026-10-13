"use client";

import { useState } from "react";
import { saveBusinessProfile } from "@/app/actions/settings";
import PhoneInput from "@/components/common/phone-input";

export default function BusinessProfileForm({
  profile,
  saved,
  hasError,
}: {
  profile: {
    businessName: string;
    businessPhone: string;
    businessPhoneCountry: string;
    businessEmail: string;
    businessWebsite: string;
    logoUrl: string;
    brandAccentColor: string;
  };
  saved: boolean;
  hasError: boolean;
}) {
  const [accentColor, setAccentColor] = useState(profile.brandAccentColor);

  return (
    <section id="business-profile" aria-labelledby="business-profile-title" className="scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-medium text-orange-600">Future white-labeling</p>
        <h2 id="business-profile-title" className="mt-1 text-xl font-semibold text-slate-900">Business Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Set the business identity and accent color used throughout your branded planner.</p>
      </div>
      {saved && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Business profile saved.</p>}
      {hasError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Check the profile fields. URLs must use HTTPS and the accent color must be a 6-digit hex value.</p>}
      <form action={saveBusinessProfile} className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Business name
          <input name="businessName" required maxLength={160} defaultValue={profile.businessName} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Business phone number
          <PhoneInput className="mt-1.5" countryName="businessPhoneCountry" numberName="businessPhone" defaultCountry={profile.businessPhoneCountry} defaultNumber={profile.businessPhone} inputClassName="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" selectClassName="shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Business email
          <input name="businessEmail" type="email" maxLength={254} defaultValue={profile.businessEmail} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Business website
          <input name="businessWebsite" type="url" placeholder="https://example.com" defaultValue={profile.businessWebsite} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Logo URL
          <input name="logoUrl" type="url" placeholder="https://example.com/logo.png" defaultValue={profile.logoUrl} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
        </label>
        <div className="sm:col-span-2">
          <span className="block text-sm font-medium text-slate-700">Accent color</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <input
              type="color"
              aria-label="Choose accent color"
              value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#FF6B00"}
              onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
              className="size-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
            <input
              aria-label="Accent color hex value"
              name="brandAccentColor"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              maxLength={7}
              pattern="#[0-9a-fA-F]{6}"
              required
              className="w-36 rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm uppercase outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-5 sm:col-span-2">
          <button type="submit" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-brand-accent-foreground transition hover:bg-orange-600">Save Business Profile</button>
        </div>
      </form>
    </section>
  );
}

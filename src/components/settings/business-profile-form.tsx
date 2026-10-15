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
    <section id="business-profile" aria-labelledby="business-profile-title" className="record-form ui-surface scroll-mt-36">
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground">Branding</p>
        <h2 id="business-profile-title" className="mt-1 text-xl font-semibold text-foreground">Business profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Set the business identity and accent color used throughout your branded planner.</p>
      </div>
      {saved && <p role="status" className="ui-feedback ui-feedback-success mb-4">Business profile saved.</p>}
      {hasError && <p role="alert" className="ui-feedback ui-feedback-error mb-4">Check the profile fields. URLs must use HTTPS and the accent color must be a 6-digit hex value.</p>}
      <form action={saveBusinessProfile} className="grid gap-5 sm:grid-cols-2">
        <label className="ui-label sm:col-span-2">
          Business name <span aria-hidden="true" className="required-indicator">*</span>
          <input name="businessName" required maxLength={160} defaultValue={profile.businessName} className="ui-input mt-1.5" />
        </label>
        <div className="ui-label">
          Business phone number
          <PhoneInput label="Business phone number" className="mt-1.5" countryName="businessPhoneCountry" numberName="businessPhone" defaultCountry={profile.businessPhoneCountry} defaultNumber={profile.businessPhone} />
        </div>
        <label className="ui-label">
          Business email
          <input name="businessEmail" type="email" maxLength={254} defaultValue={profile.businessEmail} className="ui-input mt-1.5" />
        </label>
        <label className="ui-label sm:col-span-2">
          Business website
          <input name="businessWebsite" type="url" placeholder="https://example.com" defaultValue={profile.businessWebsite} className="ui-input mt-1.5" />
        </label>
        <label className="ui-label sm:col-span-2">
          Logo URL
          <input name="logoUrl" type="url" placeholder="https://example.com/logo.png" defaultValue={profile.logoUrl} className="ui-input mt-1.5" />
        </label>
        <div className="sm:col-span-2">
          <span className="ui-label">Accent color <span aria-hidden="true" className="required-indicator">*</span></span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <input
              type="color"
              aria-label="Choose accent color"
              value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#FF6B00"}
              onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
              className="size-12 cursor-pointer rounded-lg border border-input-border bg-input p-1"
            />
            <input
              aria-label="Accent color hex value"
              name="brandAccentColor"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              maxLength={7}
              pattern="#[0-9a-fA-F]{6}"
              required
              className="ui-input max-w-36 font-mono uppercase"
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-border pt-5 sm:col-span-2">
          <button type="submit" className="ui-button ui-button-primary">Save business profile</button>
        </div>
      </form>
    </section>
  );
}

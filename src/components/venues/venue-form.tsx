import Link from "next/link";
import type { Venue, VenueContact } from "@prisma/client";
import { deleteVenue, saveVenue } from "@/app/actions/venues";
import ConfirmDeleteButton from "@/components/common/confirm-delete-button";
import PhoneInput from "@/components/common/phone-input";
import VenueAddressFields from "@/components/venues/venue-address-fields";
import VenueFiles from "@/components/venues/venue-files";

type VenueProfile = Venue & { contacts: VenueContact[]; files: { id: string; originalName: string; mimeType: string; size: number; createdAt: Date }[] };

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const phoneInputClass = "w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const phoneSelectClass = "shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-slate-700";

function Field({
  name,
  label,
  value,
  type = "text",
  maxLength = 2000,
}: {
  name: string;
  label: string;
  value?: string | number | null;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input name={name} type={type} maxLength={maxLength} defaultValue={value ?? ""} className={inputClass} />
    </label>
  );
}

export default function VenueForm({ venue, error, eventId }: { venue?: VenueProfile; error?: string; eventId?: string }) {
  const contacts = Array.from({ length: 5 }, (_, index) => venue?.contacts.find((contact) => contact.sortOrder === index));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5">
        <p className="text-sm font-medium text-orange-600">Venue records</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{venue ? "Edit venue" : "Add venue"}</h1>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error === "url" ? "Website and image URLs must use HTTP or HTTPS." : "Check the venue fields and try again."}</p>}
      {venue && <div className="mb-4 flex justify-end"><ConfirmDeleteButton action={deleteVenue} fieldName="venueId" recordId={venue.id} entityLabel="venue" itemName={venue.name} consequences="This permanently deletes the venue profile and its contacts. Events remain, but their venue association is removed." /></div>}
      <form action={saveVenue} className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <input type="hidden" name="eventContextId" value={eventId ?? ""} />
        <input type="hidden" name="venueId" value={venue?.id ?? ""} />

        <section aria-labelledby="venue-details-heading" className="grid gap-5 sm:grid-cols-2">
          <h2 id="venue-details-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Venue details</h2>
          <Field name="name" label="Venue name" value={venue?.name} maxLength={200} />
          <Field name="category" label="Category" value={venue?.category} maxLength={160} />
          <Field name="status" label="Status" value={venue?.status ?? "active"} maxLength={40} />
          <Field name="profileImageUrl" label="Profile image URL" value={venue?.profileImageUrl} type="url" maxLength={2048} />
          <Field name="website" label="Website" value={venue?.website} type="url" maxLength={2048} />
        </section>

        <section aria-labelledby="venue-address-heading" className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <h2 id="venue-address-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Address and contact</h2>
          <VenueAddressFields venue={venue ? { address: venue.address, address2: venue.address2, city: venue.city, state: venue.state, postalCode: venue.postalCode, country: venue.country } : undefined} />
          <Field name="timezone" label="Local time zone (auto-detected from U.S. ZIP when blank)" value={venue?.timezone} maxLength={120} />
          <label className={labelClass}>Telephone<PhoneInput className="mt-1.5" countryName="telephoneCountry" numberName="telephone" defaultCountry={venue?.telephoneCountry} defaultNumber={venue?.telephone} inputClassName={phoneInputClass} selectClassName={phoneSelectClass} /></label>
          <label className={labelClass}>Fax<PhoneInput className="mt-1.5" countryName="faxPhoneCountry" numberName="faxPhone" defaultCountry={venue?.faxPhoneCountry} defaultNumber={venue?.faxPhone} inputClassName={phoneInputClass} selectClassName={phoneSelectClass} /></label>
          <label className={labelClass}>Cell phone<PhoneInput className="mt-1.5" countryName="cellPhoneCountry" numberName="cellPhone" defaultCountry={venue?.cellPhoneCountry} defaultNumber={venue?.cellPhone} inputClassName={phoneInputClass} selectClassName={phoneSelectClass} /></label>
          <Field name="email" label="Email" value={venue?.email} type="text" maxLength={1000} />
          <Field name="manager" label="Manager" value={venue?.manager} maxLength={200} />
        </section>

        <section aria-labelledby="venue-travel-heading" className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <h2 id="venue-travel-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Travel and pricing</h2>
          <Field name="distance" label="Distance" value={venue?.distance} maxLength={80} />
          <Field name="travelTime" label="Travel time" value={venue?.travelTime} maxLength={80} />
          <Field name="travelFee" label="Travel fee" value={venue?.travelFee} maxLength={80} />
          <Field name="setupFee" label="Setup fee" value={venue?.setupFee} maxLength={80} />
          <Field name="taxRate" label="Tax rate" value={venue?.taxRate} maxLength={80} />
          <Field name="capacity" label="Capacity" value={venue?.capacity} type="number" maxLength={10} />
          <Field name="hourlyRate" label="Hourly rate" value={venue?.hourlyRate?.toString()} type="number" maxLength={32} />
          <label className={labelClass}>Features, comma-separated<input name="features" defaultValue={Array.isArray(venue?.features) ? venue.features.filter((feature): feature is string => typeof feature === "string").join(", ") : ""} maxLength={2000} className={inputClass} /></label>
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="needsApproval" defaultChecked={venue?.needsApproval} className="size-4 accent-orange-500" />Needs approval</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="excludeFromInfoForm" defaultChecked={venue?.excludeFromInfoForm} className="size-4 accent-orange-500" />Exclude from info form</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="oneTimeVenue" defaultChecked={venue?.oneTimeVenue} className="size-4 accent-orange-500" />One-time venue</label>
          </div>
        </section>

        <section aria-labelledby="venue-contacts-heading" className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <h2 id="venue-contacts-heading" className="text-base font-semibold text-slate-900">Venue contacts</h2>
            <p className="mt-1 text-sm text-slate-500">The five contact slots from the DJEP venue export.</p>
          </div>
          {contacts.map((contact, index) => {
            const number = index + 1;
            return (
              <fieldset key={number} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                <legend className="px-1 text-sm font-semibold text-slate-800">Contact {number}</legend>
                <Field name={`contact${number}Name`} label="Name" value={contact?.name} maxLength={200} />
                <Field name={`contact${number}Position`} label="Position" value={contact?.position} maxLength={160} />
                <label className={labelClass}>Phone<PhoneInput className="mt-1.5" countryName={`contact${number}Country`} numberName={`contact${number}Phone`} defaultCountry={contact?.phoneCountry} defaultNumber={contact?.phone} inputClassName={phoneInputClass} selectClassName={phoneSelectClass} /></label>
                <Field name={`contact${number}Email`} label="Email" value={contact?.email} maxLength={254} />
                <label className={`${labelClass} sm:col-span-2`}>Notes<textarea name={`contact${number}Notes`} defaultValue={contact?.notes ?? ""} maxLength={10000} rows={2} className={`${inputClass} resize-y`} /></label>
              </fieldset>
            );
          })}
        </section>

        <section aria-labelledby="venue-notes-heading" className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <h2 id="venue-notes-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Venue information</h2>
          <label className={`${labelClass} sm:col-span-2`}>Directions<textarea name="directions" defaultValue={venue?.directions ?? ""} maxLength={10000} rows={3} className={`${inputClass} resize-y`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Comments<textarea name="comments" defaultValue={venue?.comments ?? ""} maxLength={10000} rows={4} className={`${inputClass} resize-y`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>XML info<textarea name="xmlInfo" defaultValue={venue?.xmlInfo ?? ""} maxLength={10000} rows={4} className={`${inputClass} resize-y`} /></label>
          {venue ? (
            <VenueFiles venueId={venue.id} files={venue.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() }))} />
          ) : (
            <p className="text-sm text-slate-500 sm:col-span-2">Save the venue before uploading documents or photos.</p>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/dashboard/venues" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</Link>
          <button type="submit" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-brand-accent-foreground hover:bg-orange-600">Save venue</button>
        </div>
      </form>
    </div>
  );
}

import type { Client } from "@prisma/client";
import Link from "next/link";
import { saveClient } from "@/app/actions/clients";
import ClientPhotoUpload from "@/components/clients/client-photo-upload";

const CLIENT_ROLES = [
  { value: "client", label: "Client" },
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
];

const PHONE_TYPES = [
  { value: "mobile", label: "Mobile" },
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "fax", label: "Fax" },
  { value: "other", label: "Other" },
];

export default function ClientForm({
  client,
  error,
}: {
  client?: Client;
  error?: string;
}) {
  const photoSrc = client?.photoStorageKey
    ? `/plan/api/client-photos/${client.photoStorageKey}`
    : client?.photoUrl;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5">
        <p className="text-sm font-medium text-orange-600">Client records</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {client ? "Edit client" : "Add client"}
        </h1>
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "photo-url" ? "Photo URL must use HTTPS." : "Check the client fields and try again."}
        </p>
      )}
      {client && (
        <ClientPhotoUpload clientId={client.id} clientName={client.name} photoSrc={photoSrc} />
      )}
      {!client && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Save the client profile before uploading a photo. You can also enter a secure photo URL below.
        </p>
      )}
      <form action={saveClient} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {client && <input type="hidden" name="clientId" value={client.id} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Client name
            <input name="name" required maxLength={160} defaultValue={client?.name ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select name="role" defaultValue={client?.role ?? "client"} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100">
              {CLIENT_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              {client?.role && !CLIENT_ROLES.some((role) => role.value === client.role) && <option value={client.role}>{client.role}</option>}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input name="phone" type="tel" maxLength={40} defaultValue={client?.phone ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone type
            <select name="phoneType" defaultValue={client?.phoneType ?? "mobile"} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100">
              {PHONE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Email address
            <input name="email" type="email" required maxLength={254} defaultValue={client?.email ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Mailing address
            <input name="address" maxLength={2000} defaultValue={client?.address ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            City
            <input name="city" maxLength={120} defaultValue={client?.city ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            State / Province
            <input name="state" maxLength={120} defaultValue={client?.state ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            ZIP / Postal code
            <input name="postalCode" maxLength={32} defaultValue={client?.postalCode ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Country
            <input name="country" maxLength={120} defaultValue={client?.country ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Photo URL
            <input name="photoUrl" type="url" placeholder="https://example.com/photo.jpg" defaultValue={client?.photoUrl ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Use an HTTPS image URL, or upload a photo above.</span>
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Notes
            <textarea name="notes" rows={5} maxLength={10000} defaultValue={client?.notes ?? ""} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/dashboard/clients" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</Link>
          <button type="submit" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">Save client</button>
        </div>
      </form>
    </div>
  );
}

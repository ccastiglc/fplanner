"use client";

import { useState } from "react";
import Link from "next/link";
import type { Client, ClientAdditionalContact, ClientPerson, ClientPhoneNumber } from "@prisma/client";
import { deleteClient, saveClient } from "@/app/actions/clients";
import ClientPhotoUpload from "@/components/clients/client-photo-upload";
import ConfirmDeleteButton from "@/components/common/confirm-delete-button";

const CLIENT_ROLES = [
  { value: "client", label: "Client" },
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
] as const;

const PHONE_TYPES = [
  { value: "mobile", label: "Mobile" },
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "fax", label: "Fax" },
  { value: "other", label: "Other" },
] as const;

type PhoneDraft = Pick<ClientPhoneNumber, "number" | "type"> & { id?: string };
type PersonDraft = {
  id?: string;
  name: string;
  pronunciation: string;
  role: string;
  email: string;
  photoUrl: string;
  photoStorageKey?: string | null;
  phoneNumbers: PhoneDraft[];
};
type ContactDraft = {
  id?: string;
  name: string;
  pronunciation: string;
  role: string;
  email: string;
  phoneNumbers: PhoneDraft[];
};
type ClientProfile = Client & {
  phoneNumbers: ClientPhoneNumber[];
  persons: (ClientPerson & { phoneNumbers: ClientPhoneNumber[] })[];
  additionalContacts: (ClientAdditionalContact & { phoneNumbers: ClientPhoneNumber[] })[];
};

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const selectClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

function PhoneNumbersEditor({
  label,
  phones,
  onChange,
}: {
  label: string;
  phones: PhoneDraft[];
  onChange: (phones: PhoneDraft[]) => void;
}) {
  function updatePhone(index: number, patch: Partial<PhoneDraft>) {
    onChange(phones.map((phone, phoneIndex) => phoneIndex === index ? { ...phone, ...patch } : phone));
  }

  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      {phones.map((phone, index) => (
        <div key={phone.id ?? `${label}-${index}`} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="block text-sm text-slate-600">
            Phone number
            <input type="tel" inputMode="tel" value={phone.number} onChange={(event) => updatePhone(index, { number: event.target.value })} maxLength={40} required className={inputClass} />
          </label>
          <label className="block text-sm text-slate-600">
            Type
            <select value={phone.type} onChange={(event) => updatePhone(index, { type: event.target.value })} className={selectClass}>
              {PHONE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onChange(phones.filter((_, phoneIndex) => phoneIndex !== index))} className="self-end rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...phones, { number: "", type: "mobile" }])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white">Add phone number</button>
    </fieldset>
  );
}

export default function ClientForm({
  client,
  error,
}: {
  client?: ClientProfile;
  error?: string;
}) {
  const [photoUrl, setPhotoUrl] = useState(client?.photoUrl ?? "");
  const [postalCode, setPostalCode] = useState(client?.postalCode ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [state, setState] = useState(client?.state ?? "");
  const [country, setCountry] = useState(client?.country || "USA");
  const [postalStatus, setPostalStatus] = useState("");
  const [clientPhones, setClientPhones] = useState<PhoneDraft[]>(() => {
    if (client?.phoneNumbers.length) {
      return client.phoneNumbers.map(({ id, number, type }) => ({ id, number, type }));
    }
    return client?.phone ? [{ number: client.phone, type: client.phoneType ?? "mobile" }] : [];
  });
  const [persons, setPersons] = useState<PersonDraft[]>(
    client?.persons.map((person) => ({
      id: person.id,
      name: person.name,
      pronunciation: person.pronunciation ?? "",
      role: person.role,
      email: person.email ?? "",
      photoUrl: person.photoUrl ?? "",
      photoStorageKey: person.photoStorageKey,
      phoneNumbers: person.phoneNumbers.length
        ? person.phoneNumbers.map(({ id, number, type }) => ({ id, number, type }))
        : person.phone ? [{ number: person.phone, type: person.phoneType ?? "mobile" }] : [],
    })) ?? []
  );
  const [contacts, setContacts] = useState<ContactDraft[]>(
    client?.additionalContacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      pronunciation: contact.pronunciation ?? "",
      role: contact.role,
      phoneNumbers: contact.phoneNumbers.length
        ? contact.phoneNumbers.map(({ id, number, type }) => ({ id, number, type }))
        : contact.phone ? [{ number: contact.phone, type: "mobile" }] : [],
      email: contact.email ?? "",
    })) ?? []
  );

  const mainPhoto = client?.photoStorageKey
    ? `/plan/api/client-photos/${client.photoStorageKey}`
    : client?.photoUrl;

  async function lookupPostalCode() {
    if (!/^\d{5}$/.test(postalCode.trim())) return;
    setPostalStatus("Looking up city and state…");

    try {
      const response = await fetch(`/plan/api/postal-code?zip=${encodeURIComponent(postalCode.trim())}`);
      if (!response.ok) {
        setPostalStatus("No city/state match found; enter them manually.");
        return;
      }
      const result = await response.json();
      setCity(result.city);
      setState(result.state);
      setCountry("USA");
      setPostalStatus("City and state filled in; you can edit them.");
    } catch {
      setPostalStatus("Lookup unavailable; enter city and state manually.");
    }
  }

  function updatePerson(index: number, patch: Partial<PersonDraft>) {
    setPersons((current) => current.map((person, personIndex) =>
      personIndex === index ? { ...person, ...patch } : person
    ));
  }

  function updateContact(index: number, patch: Partial<ContactDraft>) {
    setContacts((current) => current.map((contact, contactIndex) =>
      contactIndex === index ? { ...contact, ...patch } : contact
    ));
  }

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
          {error === "photo-url" ? "Photo URLs must use HTTPS." : "Check the client fields and try again."}
        </p>
      )}
      {client ? (
        <ClientPhotoUpload
          clientId={client.id}
          clientName={client.name}
          photoSrc={mainPhoto}
          onUploaded={() => setPhotoUrl("")}
        />
      ) : (
        <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Save the client profile before uploading photos. HTTPS photo URLs can be added now.
        </p>
      )}
      {client && (
        <div className="mb-4 flex justify-end">
          <ConfirmDeleteButton
            action={deleteClient}
            fieldName="clientId"
            recordId={client.id}
            entityLabel="client"
            itemName={client.name}
            consequences="This permanently deletes the client profile and its additional persons and contacts. Events and payments remain, but their client association is removed."
          />
        </div>
      )}
      <form action={saveClient} className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {client && <input type="hidden" name="clientId" value={client.id} />}
        <input type="hidden" name="clientPhonesJson" value={JSON.stringify(clientPhones)} />
        <input type="hidden" name="personsJson" value={JSON.stringify(persons)} />
        <input type="hidden" name="contactsJson" value={JSON.stringify(contacts)} />

        <section aria-labelledby="primary-client-heading" className="grid gap-5 sm:grid-cols-2">
          <h2 id="primary-client-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Primary client</h2>
          <label className="block text-sm font-medium text-slate-700">
            Client name
            <input name="name" required maxLength={160} defaultValue={client?.name ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phonetic pronunciation
            <input name="pronunciation" maxLength={160} defaultValue={client?.pronunciation ?? ""} placeholder="How to pronounce the name" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Role
            <select name="role" defaultValue={client?.role ?? "client"} className={selectClass}>
              {CLIENT_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              {client?.role && !CLIENT_ROLES.some((role) => role.value === client.role) && <option value={client.role}>{client.role}</option>}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Email address
            <input name="email" type="email" required maxLength={254} defaultValue={client?.email ?? ""} className={inputClass} />
          </label>
          <PhoneNumbersEditor label="Phone numbers" phones={clientPhones} onChange={setClientPhones} />
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Photo URL
            <input name="photoUrl" type="url" placeholder="https://example.com/photo.jpg" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} className={inputClass} />
          </label>
        </section>

        <section aria-labelledby="mailing-address-heading" className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <h2 id="mailing-address-heading" className="text-base font-semibold text-slate-900 sm:col-span-2">Mailing address</h2>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Street address
            <input name="address" maxLength={2000} defaultValue={client?.address ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            ZIP code
            <input name="postalCode" inputMode="numeric" maxLength={32} value={postalCode} onChange={(event) => setPostalCode(event.target.value)} onBlur={lookupPostalCode} className={inputClass} />
            {postalStatus && <span role="status" className="mt-1 block text-xs font-normal text-slate-500">{postalStatus}</span>}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            City
            <input name="city" maxLength={120} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            State / Province
            <input name="state" maxLength={120} value={state} onChange={(event) => setState(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Country
            <input name="country" maxLength={120} value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass} />
          </label>
        </section>

        <section aria-labelledby="persons-heading" className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="persons-heading" className="text-base font-semibold text-slate-900">Additional persons</h2>
              <p className="mt-1 text-sm text-slate-500">People in this client group, such as both partners in a wedding.</p>
            </div>
            <button type="button" disabled={persons.length >= 3} onClick={() => setPersons((current) => current.length < 3 ? [...current, { name: "", pronunciation: "", role: "client", email: "", photoUrl: "", phoneNumbers: [] }] : current)} className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{persons.length >= 3 ? "Maximum 3 persons" : "Add person"}</button>
          </div>
          {persons.map((person, index) => {
            const personPhoto = person.photoStorageKey
              ? `/plan/api/client-photos/${person.photoStorageKey}`
              : person.photoUrl;
            return (
              <article key={person.id ?? `new-person-${index}`} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">Person {index + 2}</h3>
                  <button type="button" onClick={() => setPersons((current) => current.filter((_, personIndex) => personIndex !== index))} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Name
                    <input value={person.name} onChange={(event) => updatePerson(index, { name: event.target.value })} required maxLength={160} className={inputClass} />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Phonetic pronunciation
                    <input value={person.pronunciation} onChange={(event) => updatePerson(index, { pronunciation: event.target.value })} maxLength={160} placeholder="How to pronounce the name" className={inputClass} />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Role
                    <select value={person.role} onChange={(event) => updatePerson(index, { role: event.target.value })} className={selectClass}>
                      {CLIENT_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input type="email" value={person.email} onChange={(event) => updatePerson(index, { email: event.target.value })} maxLength={254} className={inputClass} />
                  </label>
                  <PhoneNumbersEditor label="Phone numbers" phones={person.phoneNumbers} onChange={(phoneNumbers) => updatePerson(index, { phoneNumbers })} />
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Photo URL
                    <input type="url" value={person.photoUrl} onChange={(event) => updatePerson(index, { photoUrl: event.target.value, photoStorageKey: null })} placeholder="https://example.com/photo.jpg" className={inputClass} />
                  </label>
                  {client && person.id ? (
                    <div className="sm:col-span-2">
                      <ClientPhotoUpload
                        clientId={client.id}
                        clientName={person.name || `Person ${index + 2}`}
                        personId={person.id}
                        photoSrc={personPhoto}
                        compact
                        onUploaded={(photoStorageKey) => updatePerson(index, { photoStorageKey, photoUrl: "" })}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 sm:col-span-2">Save the client profile before uploading this person’s photo.</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section aria-labelledby="notes-heading" className="border-t border-slate-100 pt-6">
          <label htmlFor="notes" id="notes-heading" className="block text-sm font-medium text-slate-700">
            Notes
            <textarea id="notes" name="notes" rows={5} maxLength={10000} defaultValue={client?.notes ?? ""} className={`${inputClass} resize-y`} />
          </label>
        </section>

        <section aria-labelledby="additional-contacts-heading" className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="additional-contacts-heading" className="text-base font-semibold text-slate-900">Additional Contacts</h2>
              <p className="mt-1 text-sm text-slate-500">Other people connected to the client, such as a parent or planner.</p>
            </div>
            <button type="button" onClick={() => setContacts((current) => [...current, { name: "", pronunciation: "", role: "", email: "", phoneNumbers: [] }])} className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Add contact</button>
          </div>
          {contacts.map((contact, index) => (
            <article key={contact.id ?? `new-contact-${index}`} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800">Contact {index + 1}</h3>
                <button type="button" onClick={() => setContacts((current) => current.filter((_, contactIndex) => contactIndex !== index))} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input value={contact.name} onChange={(event) => updateContact(index, { name: event.target.value })} required maxLength={160} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Phonetic pronunciation
                <input value={contact.pronunciation} onChange={(event) => updateContact(index, { pronunciation: event.target.value })} maxLength={160} placeholder="How to pronounce the name" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Role
                <input value={contact.role} onChange={(event) => updateContact(index, { role: event.target.value })} required maxLength={80} placeholder="Mother of Bride" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input type="email" value={contact.email} onChange={(event) => updateContact(index, { email: event.target.value })} maxLength={254} className={inputClass} />
              </label>
              <PhoneNumbersEditor label="Phone numbers" phones={contact.phoneNumbers} onChange={(phoneNumbers) => updateContact(index, { phoneNumbers })} />
            </article>
          ))}
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/dashboard/clients" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</Link>
          <button type="submit" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">Save client</button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { Client, ClientAdditionalContact, ClientPerson, ClientPhoneNumber } from "@prisma/client";
import { deleteClient, saveClient } from "@/app/actions/clients";
import ClientPhotoUpload from "@/components/clients/client-photo-upload";
import ConfirmDeleteButton from "@/components/common/confirm-delete-button";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, formatPhone } from "@/lib/phone";
import { PageHeader } from "@/components/common/page-header";

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

type PhoneDraft = Pick<ClientPhoneNumber, "number" | "type" | "country"> & { id?: string };
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

const inputClass = "ui-input mt-1.5";

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
      <legend className="ui-label mb-1">{label}</legend>
      {phones.map((phone, index) => (
        <div key={phone.id ?? `${label}-${index}`} className="grid gap-3 rounded-lg bg-surface-secondary p-3 lg:grid-cols-[120px_minmax(0,1fr)_120px_auto]">
          <label className="ui-label">
            Country
            <select value={phone.country} onChange={(event) => updatePhone(index, { country: event.target.value, number: formatPhone(phone.number, event.target.value) })} className={inputClass}>
              {PHONE_COUNTRIES.map((option) => <option key={option.code} value={option.code}>{option.code} {option.dial}</option>)}
            </select>
          </label>
          <label className="ui-label">
            Phone number <span aria-hidden="true" className="required-indicator">*</span>
            <input type="tel" inputMode="tel" value={phone.number} onChange={(event) => updatePhone(index, { number: formatPhone(event.target.value, phone.country) })} maxLength={40} required className={inputClass} />
          </label>
          <label className="ui-label">
            Type
            <select value={phone.type} onChange={(event) => updatePhone(index, { type: event.target.value })} className={inputClass}>
              {PHONE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onChange(phones.filter((_, phoneIndex) => phoneIndex !== index))} className="ui-button ui-button-danger-outline self-end">Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...phones, { number: "", type: "mobile", country: DEFAULT_PHONE_COUNTRY }])} className="ui-button">Add phone number</button>
    </fieldset>
  );
}

export default function ClientForm({
  client,
  error,
  eventId,
}: {
  client?: ClientProfile;
  error?: string;
  eventId?: string;
}) {
  const [photoUrl, setPhotoUrl] = useState(client?.photoUrl ?? "");
  const [postalCode, setPostalCode] = useState(client?.postalCode ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [state, setState] = useState(client?.state ?? "");
  const [country, setCountry] = useState(client?.country || "USA");
  const [postalStatus, setPostalStatus] = useState("");
  const [clientPhones, setClientPhones] = useState<PhoneDraft[]>(() => {
    if (client?.phoneNumbers.length) {
      return client.phoneNumbers.map(({ id, number, type, country }) => ({ id, number, type, country }));
    }
    return client?.phone ? [{ number: client.phone, type: client.phoneType ?? "mobile", country: client.phoneCountry ?? DEFAULT_PHONE_COUNTRY }] : [];
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
        ? person.phoneNumbers.map(({ id, number, type, country }) => ({ id, number, type, country }))
        : person.phone ? [{ number: person.phone, type: person.phoneType ?? "mobile", country: person.phoneCountry ?? DEFAULT_PHONE_COUNTRY }] : [],
    })) ?? []
  );
  const [contacts, setContacts] = useState<ContactDraft[]>(
    client?.additionalContacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      pronunciation: contact.pronunciation ?? "",
      role: contact.role,
      phoneNumbers: contact.phoneNumbers.length
        ? contact.phoneNumbers.map(({ id, number, type, country }) => ({ id, number, type, country }))
        : contact.phone ? [{ number: contact.phone, type: "mobile", country: contact.phoneCountry ?? DEFAULT_PHONE_COUNTRY }] : [],
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
      <PageHeader title={client ? "Edit client" : "Add client"} eyebrow="Client records" />
      {error && (
        <p role="alert" className="ui-feedback ui-feedback-error mb-4">
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
        <p className="ui-feedback ui-feedback-information mb-4">
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
      <form action={saveClient} className="record-form ui-surface space-y-6">
        <input type="hidden" name="eventContextId" value={eventId ?? ""} />
        {client && <input type="hidden" name="clientId" value={client.id} />}
        <input type="hidden" name="clientPhonesJson" value={JSON.stringify(clientPhones)} />
        <input type="hidden" name="personsJson" value={JSON.stringify(persons)} />
        <input type="hidden" name="contactsJson" value={JSON.stringify(contacts)} />

        <section aria-labelledby="primary-client-heading" className="grid gap-5 sm:grid-cols-2">
          <h2 id="primary-client-heading" className="text-base font-semibold text-foreground sm:col-span-2">Primary client</h2>
          <label className="ui-label">
            Client name <span aria-hidden="true" className="required-indicator">*</span>
            <input name="name" required maxLength={160} defaultValue={client?.name ?? ""} className={inputClass} />
          </label>
          <label className="ui-label">
            Phonetic pronunciation
            <input name="pronunciation" maxLength={160} defaultValue={client?.pronunciation ?? ""} placeholder="How to pronounce the name" className={inputClass} />
          </label>
          <label className="ui-label">
            Role
            <select name="role" defaultValue={client?.role ?? "client"} className={inputClass}>
              {CLIENT_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              {client?.role && !CLIENT_ROLES.some((role) => role.value === client.role) && <option value={client.role}>{client.role}</option>}
            </select>
          </label>
          <label className="ui-label sm:col-span-2">
            Email address
            <input name="email" type="email" maxLength={254} defaultValue={client?.email ?? ""} className={inputClass} />
          </label>
          <PhoneNumbersEditor label="Phone numbers" phones={clientPhones} onChange={setClientPhones} />
          <label className="ui-label sm:col-span-2">
            Photo URL
            <input name="photoUrl" type="url" placeholder="https://example.com/photo.jpg" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} className={inputClass} />
          </label>
        </section>

        <section aria-labelledby="mailing-address-heading" className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
          <h2 id="mailing-address-heading" className="text-base font-semibold text-foreground sm:col-span-2">Mailing address</h2>
          <label className="ui-label sm:col-span-2">
            Street address
            <input name="address" maxLength={2000} defaultValue={client?.address ?? ""} className={inputClass} />
          </label>
          <label className="ui-label">
            ZIP code
            <input name="postalCode" inputMode="numeric" maxLength={32} value={postalCode} onChange={(event) => setPostalCode(event.target.value)} onBlur={lookupPostalCode} className={inputClass} />
            {postalStatus && <span role="status" className="mt-1 block text-xs font-normal text-muted-foreground">{postalStatus}</span>}
          </label>
          <label className="ui-label">
            City
            <input name="city" maxLength={120} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} />
          </label>
          <label className="ui-label">
            State / Province
            <input name="state" maxLength={120} value={state} onChange={(event) => setState(event.target.value)} className={inputClass} />
          </label>
          <label className="ui-label">
            Country
            <input name="country" maxLength={120} value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass} />
          </label>
        </section>

        <section aria-labelledby="persons-heading" className="space-y-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="persons-heading" className="text-base font-semibold text-foreground">Additional persons</h2>
              <p className="mt-1 text-sm text-muted-foreground">People in this client group, such as both partners in a wedding.</p>
            </div>
            <button type="button" disabled={persons.length >= 3} onClick={() => setPersons((current) => current.length < 3 ? [...current, { name: "", pronunciation: "", role: "client", email: "", photoUrl: "", phoneNumbers: [] }] : current)} className="ui-button">{persons.length >= 3 ? "Maximum 3 persons" : "Add person"}</button>
          </div>
          {persons.map((person, index) => {
            const personPhoto = person.photoStorageKey
              ? `/plan/api/client-photos/${person.photoStorageKey}`
              : person.photoUrl;
            return (
              <article key={person.id ?? `new-person-${index}`} className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-foreground">Person {index + 2}</h3>
                  <button type="button" onClick={() => setPersons((current) => current.filter((_, personIndex) => personIndex !== index))} className="ui-text-danger text-sm">Remove</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="ui-label">
                    Name <span aria-hidden="true" className="required-indicator">*</span>
                    <input value={person.name} onChange={(event) => updatePerson(index, { name: event.target.value })} required maxLength={160} className={inputClass} />
                  </label>
                  <label className="ui-label">
                    Phonetic pronunciation
                    <input value={person.pronunciation} onChange={(event) => updatePerson(index, { pronunciation: event.target.value })} maxLength={160} placeholder="How to pronounce the name" className={inputClass} />
                  </label>
                  <label className="ui-label">
                    Role
                    <select value={person.role} onChange={(event) => updatePerson(index, { role: event.target.value })} className={inputClass}>
                      {CLIENT_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </label>
                  <label className="ui-label">
                    Email address
                    <input type="email" value={person.email} onChange={(event) => updatePerson(index, { email: event.target.value })} maxLength={254} className={inputClass} />
                  </label>
                  <PhoneNumbersEditor label="Phone numbers" phones={person.phoneNumbers} onChange={(phoneNumbers) => updatePerson(index, { phoneNumbers })} />
                  <label className="ui-label sm:col-span-2">
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
                    <p className="text-xs text-muted-foreground sm:col-span-2">Save the client profile before uploading this person’s photo.</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section aria-labelledby="notes-heading" className="border-t border-border pt-6">
          <label htmlFor="notes" id="notes-heading" className="ui-label">
            Notes
            <textarea id="notes" name="notes" rows={5} maxLength={10000} defaultValue={client?.notes ?? ""} className={`${inputClass} resize-y`} />
          </label>
        </section>

        <section aria-labelledby="additional-contacts-heading" className="space-y-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="additional-contacts-heading" className="text-base font-semibold text-foreground">Additional contacts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Other people connected to the client, such as a parent or planner.</p>
            </div>
            <button type="button" onClick={() => setContacts((current) => [...current, { name: "", pronunciation: "", role: "", email: "", phoneNumbers: [] }])} className="ui-button">Add contact</button>
          </div>
          {contacts.map((contact, index) => (
            <article key={contact.id ?? `new-contact-${index}`} className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <h3 className="text-sm font-medium text-foreground">Contact {index + 1}</h3>
                <button type="button" onClick={() => setContacts((current) => current.filter((_, contactIndex) => contactIndex !== index))} className="ui-text-danger text-sm">Remove</button>
              </div>
              <label className="ui-label">
                Name <span aria-hidden="true" className="required-indicator">*</span>
                <input value={contact.name} onChange={(event) => updateContact(index, { name: event.target.value })} required maxLength={160} className={inputClass} />
              </label>
              <label className="ui-label">
                Phonetic pronunciation
                <input value={contact.pronunciation} onChange={(event) => updateContact(index, { pronunciation: event.target.value })} maxLength={160} placeholder="How to pronounce the name" className={inputClass} />
              </label>
              <label className="ui-label">
                Role <span aria-hidden="true" className="required-indicator">*</span>
                <input value={contact.role} onChange={(event) => updateContact(index, { role: event.target.value })} required maxLength={80} placeholder="Mother of Bride" className={inputClass} />
              </label>
              <label className="ui-label">
                Email
                <input type="email" value={contact.email} onChange={(event) => updateContact(index, { email: event.target.value })} maxLength={254} className={inputClass} />
              </label>
              <PhoneNumbersEditor label="Phone numbers" phones={contact.phoneNumbers} onChange={(phoneNumbers) => updateContact(index, { phoneNumbers })} />
            </article>
          ))}
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Link href="/dashboard/clients" className="ui-button">Cancel</Link>
          <button type="submit" className="ui-button ui-button-primary">Save client</button>
        </div>
      </form>
    </div>
  );
}

CREATE TABLE "ClientPhoneNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mobile',
    "clientId" TEXT,
    "personId" TEXT,
    "additionalContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientPhoneNumber_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClientPhoneNumber_single_owner_check" CHECK (num_nonnulls("clientId", "personId", "additionalContactId") = 1)
);

CREATE INDEX "ClientPhoneNumber_clientId_idx" ON "ClientPhoneNumber"("clientId");
CREATE INDEX "ClientPhoneNumber_personId_idx" ON "ClientPhoneNumber"("personId");
CREATE INDEX "ClientPhoneNumber_additionalContactId_idx" ON "ClientPhoneNumber"("additionalContactId");
CREATE INDEX "ClientPhoneNumber_number_idx" ON "ClientPhoneNumber"("number");

ALTER TABLE "ClientPhoneNumber" ADD CONSTRAINT "ClientPhoneNumber_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPhoneNumber" ADD CONSTRAINT "ClientPhoneNumber_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "ClientPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPhoneNumber" ADD CONSTRAINT "ClientPhoneNumber_additionalContactId_fkey"
FOREIGN KEY ("additionalContactId") REFERENCES "ClientAdditionalContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ClientPhoneNumber" ("id", "number", "type", "clientId", "createdAt", "updatedAt")
SELECT 'legacy-client-' || md5("id"), "phone", COALESCE(NULLIF("phoneType", ''), 'mobile'), "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Client"
WHERE "phone" IS NOT NULL AND btrim("phone") <> '';

INSERT INTO "ClientPhoneNumber" ("id", "number", "type", "personId", "createdAt", "updatedAt")
SELECT 'legacy-person-' || md5("id"), "phone", COALESCE(NULLIF("phoneType", ''), 'mobile'), "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ClientPerson"
WHERE "phone" IS NOT NULL AND btrim("phone") <> '';

INSERT INTO "ClientPhoneNumber" ("id", "number", "type", "additionalContactId", "createdAt", "updatedAt")
SELECT 'legacy-contact-' || md5("id"), "phone", 'mobile', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ClientAdditionalContact"
WHERE "phone" IS NOT NULL AND btrim("phone") <> '';

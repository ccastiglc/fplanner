ALTER TABLE "OrganizationSettings" ADD COLUMN "businessPhoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "Client" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "ClientPerson" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "ClientAdditionalContact" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "ClientPhoneNumber" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'US';
ALTER TABLE "Venue"
  ADD COLUMN "telephoneCountry" TEXT DEFAULT 'US',
  ADD COLUMN "faxPhoneCountry" TEXT DEFAULT 'US',
  ADD COLUMN "cellPhoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "VenueContact" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "Staff" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';
ALTER TABLE "Vendor" ADD COLUMN "phoneCountry" TEXT DEFAULT 'US';

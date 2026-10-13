CREATE FUNCTION planner_format_us_phone(value text)
RETURNS text AS $$
DECLARE
  digits text;
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN value;
  END IF;
  digits := regexp_replace(value, '\D', '', 'g');
  IF digits = '' THEN
    RETURN value;
  END IF;
  IF length(digits) = 11 AND left(digits, 1) = '1' THEN
    digits := right(digits, 10);
  ELSIF length(digits) <> 10 THEN
    RETURN value;
  END IF;
  RETURN substr(digits, 1, 3) || '-' || substr(digits, 4, 3) || '-' || substr(digits, 7, 4);
END;
$$ LANGUAGE plpgsql;

UPDATE "OrganizationSettings" SET "businessPhone" = planner_format_us_phone("businessPhone") WHERE "businessPhone" IS NOT NULL;
UPDATE "Client" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;
UPDATE "ClientPerson" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;
UPDATE "ClientAdditionalContact" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;
UPDATE "ClientPhoneNumber" SET "number" = planner_format_us_phone("number") WHERE "number" IS NOT NULL;
UPDATE "Venue" SET "telephone" = planner_format_us_phone("telephone") WHERE "telephone" IS NOT NULL;
UPDATE "Venue" SET "faxPhone" = planner_format_us_phone("faxPhone") WHERE "faxPhone" IS NOT NULL;
UPDATE "Venue" SET "cellPhone" = planner_format_us_phone("cellPhone") WHERE "cellPhone" IS NOT NULL;
UPDATE "VenueContact" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;
UPDATE "Staff" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;
UPDATE "Vendor" SET "phone" = planner_format_us_phone("phone") WHERE "phone" IS NOT NULL;

DROP FUNCTION planner_format_us_phone(text);

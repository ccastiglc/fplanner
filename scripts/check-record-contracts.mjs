import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

const baseline = process.argv[2] ?? "cc8271e";
const files = [
  "src/app/page.tsx",
  "src/app/dashboard/events/page.tsx",
  "src/app/dashboard/events/[eventId]/page.tsx",
  "src/app/dashboard/clients/page.tsx",
  "src/app/dashboard/clients/[clientId]/page.tsx",
  "src/app/dashboard/venues/page.tsx",
  "src/app/dashboard/venues/[venueId]/page.tsx",
  "src/app/dashboard/staff/page.tsx",
  "src/app/dashboard/staff/[staffId]/page.tsx",
  "src/components/clients/client-form.tsx",
  "src/components/clients/client-photo-upload.tsx",
  "src/components/venues/venue-form.tsx",
  "src/components/venues/venue-address-fields.tsx",
  "src/components/venues/venue-files.tsx",
  "src/components/events/event-form.tsx",
  "src/components/events/event-linked-records.tsx",
  "src/components/events/event-detail-fields.tsx",
  "src/components/events/event-return-link.tsx",
  "src/components/settings/business-profile-form.tsx",
  "src/components/settings/data-management.tsx",
  "src/components/common/phone-input.tsx",
  "src/components/common/confirm-delete-button.tsx",
];
const attributes = new Set(["action", "formAction", "onSubmit", "method", "name", "type", "required", "minLength", "maxLength", "min", "max", "pattern", "accept", "multiple", "defaultValue", "defaultChecked", "value", "href", "countryName", "numberName", "defaultCountry", "defaultNumber", "onChange", "onBlur", "onUploaded"]);
const printer = ts.createPrinter({ removeComments: true });

function contracts(file, source) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && attributes.has(node.name.text)) {
      result.push(`${node.parent.parent.tagName.getText(tree)}:${node.name.text}:${node.initializer ? printer.printNode(ts.EmitHint.Unspecified, node.initializer, tree) : "true"}`);
    }
    if (ts.isCallExpression(node) && /^(prisma\.|fetch$|auth$|eventAccess$|redirect$|signIn$)/.test(node.expression.getText(tree))) {
      result.push(printer.printNode(ts.EmitHint.Unspecified, node, tree));
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result.sort();
}

for (const file of files) {
  const before = execFileSync("git", ["show", `${baseline}:${file}`], { encoding: "utf8" });
  const after = readFileSync(file, "utf8");
  assert.deepEqual(contracts(file, after), contracts(file, before), `Record contract changed: ${file}`);
}
process.stdout.write(`${files.length} record field, validation, action, upload, and link contracts match ${baseline}.\n`);

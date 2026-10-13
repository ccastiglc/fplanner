import { XMLParser } from "fast-xml-parser";
import { redactImportedNotes } from "@/lib/spreadsheet";

export function importEventPlanning(xml: string) {
  const parser = new XMLParser({ processEntities: false, parseTagValue: false, ignoreAttributes: true, isArray: (name) => ["ACTIVITY", "SS", "DJEP_FORM", "DJEP_FORM_TABLE", "DJEP_QUESTION"].includes(name) });
  const result: Record<string, string> = {};
  const tags = ["EQUIPMENT_NOTES", "TIMELINE", "SPECIAL_SONGS", "PLANNER_NAMES", "DJEP_PPF", "DJEP_ADDITIONAL_PLANNING_FORMS", "DJEP_CLIENT_NOTES", "DJEP_COMPANY_NOTES"];
  for (const tag of tags) {
    const fragments = [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))];
    if (!fragments.length) continue;
    const values = fragments.map((fragment) => {
      const safe = redactImportedNotes(fragment[1]);
      if (!["TIMELINE", "SPECIAL_SONGS", "PLANNER_NAMES", "DJEP_PPF", "DJEP_ADDITIONAL_PLANNING_FORMS"].includes(tag)) return safe;
      if (/<!DOCTYPE|<!ENTITY/i.test(safe)) return "Planning content contains an unsupported XML declaration.";
      try { return parser.parse(`<root>${safe.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/gi, "&amp;")}</root>`).root; } catch { return "Planning content could not be parsed; review the original export."; }
    });
    result[tag.toLowerCase().replace(/_/g, " ")] = typeof values[0] === "string" && values.length === 1 ? values[0] : JSON.stringify(values, null, 2);
  }
  return result;
}

import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { ImportRowError, mapImportRow, type ImportEntity } from "@/lib/data-import";
import { parseSpreadsheet, importValue } from "@/lib/spreadsheet";
import { importEvent } from "@/lib/event-import";
import { completePastBookedEvents } from "@/lib/event-status.mjs";

const entities = new Set<string>(["clients", "venues", "staff", "services", "payments", "events"]);
const maxFileBytes = 10 * 1024 * 1024;
const maxRows = 10000;

async function createRecord(transaction: Prisma.TransactionClient, record: ReturnType<typeof mapImportRow>) {
  switch (record.model) {
    case "clients":
      return transaction.client.create({ data: record.data });
    case "venues":
      return transaction.venue.create({ data: record.data });
    case "staff":
      return transaction.staff.create({ data: record.data });
    case "services":
      return transaction.service.create({ data: record.data });
    case "payments":
      return transaction.payment.create({ data: record.data });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxFileBytes + 128 * 1024) {
    return Response.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });
  }

  const formData = await request.formData();
  const entity = String(formData.get("entity") ?? "") as ImportEntity;
  const sourceOption = String(formData.get("source") ?? "other");
  const file = formData.get("file");

  if (!entities.has(entity)) return Response.json({ error: "Choose a supported record type." }, { status: 400 });
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a CSV or XLSX file." }, { status: 400 });
  if (file.size > maxFileBytes) return Response.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });

  let rows: Awaited<ReturnType<typeof parseSpreadsheet>>;
  try {
    rows = await parseSpreadsheet(file.name, Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not read the file." }, { status: 400 });
  }

  if (!rows.length) return Response.json({ error: "The first sheet contains no data rows." }, { status: 400 });
  if (String(entity) === "events") rows = rows.filter((row) => !/^Number of Results:/i.test(Object.values(row)[0] ?? ""));
  if (rows.length > maxRows) return Response.json({ error: `The file exceeds the ${maxRows} row import limit.` }, { status: 413 });

  const organizationId = await getSettingsOrganizationId(session.user.organizationId);
  const source = sourceOption === "djep" ? "djep" : "manual";
  const batch = await prisma.importBatch.create({
    data: {
      organizationId,
      source,
      fileName: file.name.slice(0, 255),
      status: "processing",
      totalRecords: rows.length,
      startedAt: new Date(),
    },
  });

  let imported = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      await prisma.$transaction(async (transaction) => {
        if (String(entity) === "events") {
          await importEvent(transaction, row, organizationId, session.user.id);
        } else {
          const record = mapImportRow(entity, row, source === "djep" ? "djep" : "csv", organizationId);
          if (record.model === "venues" && source === "djep" && importValue(row, "Venue ID") === "0") throw new ImportRowError("Venue ID 0 is not a venue profile.");
          await createRecord(transaction, record);
        }
        await transaction.importRow.create({
          data: { importBatchId: batch.id, mappedTo: entity, status: "success" },
        });
      }, { timeout: 20000 });
      imported += 1;
    } catch (error) {
      errorCount += 1;
      const reason = error instanceof ImportRowError ? error.message : "Record could not be imported.";
      if (errors.length < 10) errors.push(`Row ${index + 2}: ${reason}`);
      await prisma.importRow.create({
        data: { importBatchId: batch.id, mappedTo: entity, status: "failed", errorMessage: reason },
      });
    }
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: imported === 0 ? "failed" : "completed",
      processedRecords: imported,
      errorCount,
      finishedAt: new Date(),
    },
  });

  if (String(entity) === "events") await completePastBookedEvents(prisma);
  return Response.json({ batchId: batch.id, total: rows.length, imported, errorCount, errors });
}

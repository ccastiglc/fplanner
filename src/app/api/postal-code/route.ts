import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const postalCode = new URL(request.url).searchParams.get("zip")?.trim() ?? "";
  if (!/^\d{5}$/.test(postalCode)) {
    return Response.json({ error: "Enter a valid five-digit U.S. ZIP code." }, { status: 400 });
  }

  const response = await fetch(`https://api.zippopotam.us/us/${postalCode}`, {
    cache: "force-cache",
  });
  if (!response.ok) return Response.json({ error: "ZIP code not found." }, { status: 404 });

  const result = await response.json();
  const place = result.places?.[0];
  if (!place?.["place name"] || !place?.["state abbreviation"]) {
    return Response.json({ error: "ZIP code lookup returned no city/state." }, { status: 404 });
  }

  return Response.json({ city: place["place name"], state: place["state abbreviation"] });
}

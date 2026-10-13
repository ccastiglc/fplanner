import Link from "next/link";

export default function EventReturnLink({ eventId }: { eventId?: string }) {
  if (!eventId || !/^[a-zA-Z0-9_-]{1,128}$/.test(eventId)) return null;
  return <Link href={`/dashboard/events/${eventId}`} className="mb-4 inline-block text-sm font-semibold text-orange-700 hover:underline">Return to saved event</Link>;
}

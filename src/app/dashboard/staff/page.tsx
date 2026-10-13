import Link from "next/link";
import { eventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export default async function StaffPage() {
  const { user } = await eventAccess(true);
  const staff = await prisma.staff.findMany({ where: user.organizationId ? { organizationId: user.organizationId } : {}, orderBy: { name: "asc" } });
  return <div className="mx-auto max-w-5xl space-y-5"><header className="flex justify-between"><h1 className="text-2xl font-semibold text-slate-900">Staff</h1><Link href="/dashboard/staff/new" className="text-sm font-semibold text-orange-700">Add staff</Link></header><section className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{staff.map((person) => <Link key={person.id} href={`/dashboard/staff/${person.id}`} className="block p-5 hover:bg-orange-50"><h2 className="font-semibold text-slate-900">{person.name}</h2><p className="text-sm text-slate-500">{person.email} · {person.phone} · {person.specialty} · {person.status}</p></Link>)}{!staff.length && <p className="p-5 text-sm text-slate-500">No staff profiles yet.</p>}</section></div>;
}

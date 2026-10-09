"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Event {
  id: string;
  name: string;
  status: string;
  startDateTime: string;
  endDateTime: string;
  clientName: string | null;
  venueName: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const allEvents = await prisma.event.findMany({
        include: {
          client: {
            select: { name: true },
          },
          venue: {
            select: { name: true },
          },
        },
        orderBy: { startDateTime: "asc" },
      });

      setEvents(
        allEvents.map((e: { id: string; name: string; status: string; startDateTime: Date; endDateTime: Date; client: any; venue: any }) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          startDateTime: e.startDateTime.toISOString().split("T")[0],
          endDateTime: e.endDateTime.toISOString().split("T")[0],
          clientName: e.client?.name || "No client",
          venueName: e.venue?.name || "No venue",
        }))
      );
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground">
                No events found.{" "}
                <Button className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                  Add First Event
                </Button>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rounded-border border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left text-sm font-medium text-foreground p-4">Event</th>
                      <th className="text-left text-sm font-medium text-foreground p-4">Client</th>
                      <th className="text-left text-sm font-medium text-foreground p-4">Venue</th>
                      <th className="text-left text-sm font-medium text-foreground p-4">Date Range</th>
                      <th className="text-left text-sm font-medium text-foreground p-4">Status</th>
                      <th className="text-right text-sm font-medium text-foreground p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event: Event) => (
                      <tr key={event.id} className="border-b border-border hover:bg-surface/30 transition-colors">
                        <td className="font-medium text-foreground p-4">{event.name}</td>
                        <td className="text-sm text-foreground/70 p-4">{event.clientName}</td>
                        <td className="text-sm text-foreground/70 p-4">{event.venueName}</td>
                        <td className="text-sm text-foreground/70 p-4">
                          {event.startDateTime} - {event.endDateTime}
                        </td>
                        <td className="text-sm p-4">
                          <span
                            className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${event.status === "planned"
                              ? "bg-primary/10 text-primary"
                              : event.status === "confirmed"
                                  ? "bg-success/10 text-success"
                                  : "bg-error/10 text-error"}`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          <Button className="gap-1">
                            View
                          </Button>
                          <Button
                            className="gap-1"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Add Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            asChild
            className="rounded-full bg-primary px-4 py-2 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
}
import type { ComponentType, SVGProps } from "react";
import { Camera, Disc3, Lightbulb, Mic } from "lucide-react";

export const DEMO_EVENTS = [
  {
    id: "demo-bob-sue-wedding",
    date: "2026-10-11",
    type: "Wedding",
    clients: "Bob & Sue",
    venue: "The Pennsylvanian",
    status: "completed",
    services: ["DJ", "Uplighting", "Photo booth", "Emcee"],
  },
  {
    id: "demo-jane-alex-wedding",
    date: "2026-10-17",
    type: "Wedding",
    clients: "Jane & Alex",
    venue: "Phipps Conservatory",
    status: "booked",
    services: ["DJ", "Uplighting", "Photo booth"],
  },
  {
    id: "demo-northstar-gala",
    date: "2026-10-24",
    type: "Corporate gala",
    clients: "Northstar Group",
    venue: "Rivers Casino",
    status: "pending",
    services: ["DJ", "Emcee"],
  },
  {
    id: "demo-morgan-lee-wedding",
    date: "2026-11-11",
    type: "Wedding",
    clients: "Morgan & Lee",
    venue: "The Pennsylvanian",
    status: "booked",
    services: ["DJ", "Uplighting", "Photo booth", "Emcee"],
  },
] as const;

export const SERVICE_ICONS: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  DJ: Disc3,
  Uplighting: Lightbulb,
  "Photo booth": Camera,
  Emcee: Mic,
};

export const DEMO_TASKS = [
  {
    title: "Send post-event follow-up",
    detail: "Bob & Sue · Wedding · October 11",
    action: "Automate follow-up",
  },
  {
    title: "Schedule a planning call",
    detail: "Morgan & Lee · Wedding · November 11",
    action: "Automate reminder",
  },
] as const;

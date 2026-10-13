import type { ComponentType, SVGProps } from "react";
import { Camera, Disc3, Lightbulb, Mic, Wrench } from "lucide-react";

export const SERVICE_ICONS: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  DJ: Disc3,
  Uplighting: Lightbulb,
  "Photo booth": Camera,
  Emcee: Mic,
};

export function serviceIcon(name: string) {
  return SERVICE_ICONS[name] ?? Wrench;
}

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

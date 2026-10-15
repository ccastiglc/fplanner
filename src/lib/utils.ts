export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "EP";
}

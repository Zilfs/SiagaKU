import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { WeatherKind } from "../weather-view";

const ICONS: Record<WeatherKind, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
};

/** The lucide icon for a weather kind; decorative, so pair it with visible or sr-only text. */
export function WeatherIcon({
  kind,
  size = 18,
}: {
  kind: WeatherKind;
  size?: number;
}) {
  const Icon = ICONS[kind];
  return <Icon size={size} aria-hidden="true" />;
}

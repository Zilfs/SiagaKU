import Link from "next/link";
import { Bell } from "lucide-react";

/** The district page's path into the early-warning flow (docs/04): watch this area. */
export function WatchButton({
  districtSlug,
  districtName,
}: {
  districtSlug: string;
  districtName: string;
}) {
  return (
    <Link
      className="btn btn--secondary"
      href={`/peringatan?kecamatan=${encodeURIComponent(districtSlug)}`}
    >
      <Bell size={16} aria-hidden="true" />
      Pantau wilayah ini
      <span className="sr-only">, {districtName}</span>
    </Link>
  );
}

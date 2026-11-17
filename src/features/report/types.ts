/** The report shapes. The API is W3's (docs/07); it is not on dev yet. */

/** The fields the report form needs from a district. */
export type ReportDistrict = {
  id: number;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};

/** A report as the UI shows it, whatever casing the API uses. */
export type ReportPoint = {
  id: string;
  lat: number;
  lng: number;
  photoUrl: string;
  severity: number;
  summary: string;
  isDemo: boolean;
  createdAt: string;
};

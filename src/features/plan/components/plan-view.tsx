import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  MapPin,
  Phone,
  ShieldCheck,
  TriangleExclamationPoint,
  Users,
} from "lucide-react";
import type { PlanResponse, ReadinessLevel } from "@/features/plan/ui-types";
import { safePointTypeLabel } from "@/lib/safe-point-label";
import { Checklist } from "./checklist";
import { PlanTabs } from "./plan-tabs";
import { ShareActions } from "./share-actions";

const READINESS: Record<ReadinessLevel, string> = {
  advisory: "Waspada",
  watch: "Siaga",
  warning: "Awas",
};

function dateLabel(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** The shareable plan page: summary, go-kit, the three phases, safe points and contacts. */
export function PlanView({ plan }: { plan: PlanResponse }) {
  const {
    district,
    profile,
    plan: content,
    safePoints,
    emergencyContacts,
  } = plan;
  const members =
    profile.members.adults +
    profile.members.children +
    profile.members.infants +
    profile.members.elderly +
    profile.members.pregnant;
  const selected = new Set(content.safePointIds);

  return (
    <article className="sk-page sk-plan-page">
      <div className="wrap">
        <nav className="sk-crumbs" aria-label="Remah roti">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <Link href="/rencana">Rencana</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{district.name}</span>
        </nav>

        <header className="sk-plan-head">
          <div>
            <p className="sk-eyebrow">{district.city} · DKI Jakarta</p>
            <h1>Rencana siaga keluarga</h1>
            <p className="sk-plan-meta">
              <span>
                <MapPin size={14} aria-hidden="true" />
                {district.name}
              </span>
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                {dateLabel(plan.createdAt)}
              </span>
              <span className="sk-tag">
                <ShieldCheck size={13} aria-hidden="true" />
                {READINESS[content.recommendedReadinessLevel] ?? "Siaga"}
              </span>
            </p>
          </div>
          <ShareActions
            districtSlug={district.slug}
            districtName={district.name}
          />
        </header>

        <section
          className="sk-card sk-plan-summary"
          aria-labelledby="ringkasan-h"
        >
          <div className="sk-card__head">
            <h2 id="ringkasan-h" className="sk-heading-icon">
              <ClipboardList size={18} aria-hidden="true" />
              Ringkasan
            </h2>
            <span className="sk-mono">{members} anggota</span>
          </div>
          <p>{content.summary}</p>
        </section>

        <div className="sk-plan-grid">
          <Checklist key={plan.slug} slug={plan.slug} items={content.goKit} />
          <PlanTabs
            before={content.before}
            during={content.during}
            after={content.after}
          />

          {content.vulnerableGroups.length > 0 ? (
            <section
              className="sk-card sk-plan-vuln"
              aria-labelledby="rentan-h"
            >
              <div className="sk-card__head">
                <h2 id="rentan-h" className="sk-heading-icon">
                  <Users size={18} aria-hidden="true" />
                  Catatan kelompok rentan
                </h2>
              </div>
              <ul>
                {content.vulnerableGroups.map((group) => (
                  <li key={group.group}>
                    <b>{group.group}</b>
                    <ul>
                      {group.notes.map((note, index) => (
                        <li key={`${group.group}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="sk-card sk-plan-safe" aria-labelledby="aman-h">
            <div className="sk-card__head">
              <h2 id="aman-h">Titik aman</h2>
              <span className="sk-mono">
                {content.safePointIds.length} disarankan
              </span>
            </div>
            <ul>
              {safePoints.map((point) => (
                <li
                  key={point.id}
                  className={selected.has(point.id) ? "is-on" : ""}
                >
                  <div>
                    <b>{point.name}</b>
                    <span>
                      {safePointTypeLabel(point.type)} ·{" "}
                      {point.isVerified ? "Terverifikasi" : "Perkiraan"}
                    </span>
                  </div>
                  {selected.has(point.id) ? (
                    <span className="sk-tag">Disarankan</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="sk-plan-safe__reason">{content.safePointReason}</p>
          </section>

          <section
            className="sk-card sk-plan-contacts"
            aria-labelledby="kontak-h"
          >
            <div className="sk-card__head">
              <h2 id="kontak-h" className="sk-heading-icon">
                <Phone size={18} aria-hidden="true" />
                Kontak darurat
              </h2>
            </div>
            <ul>
              {emergencyContacts.map((contact) => (
                <li key={`${contact.name}-${contact.phone}`}>
                  <div>
                    <b>{contact.name}</b>
                    <span>{contact.scope}</span>
                  </div>
                  <a href={`tel:${contact.phone}`}>
                    <Phone size={15} aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn--primary" href="tel:112">
              <TriangleExclamationPoint size={16} aria-hidden="true" />
              Telepon 112
            </a>
          </section>
        </div>

        <p className="sk-detail-note">
          Rencana ini panduan kesiapsiagaan, bukan peringatan resmi. Periksa
          kembali bersama keluarga dan ikuti arahan petugas saat banjir. Untuk
          darurat, hubungi 112.
        </p>
      </div>
    </article>
  );
}

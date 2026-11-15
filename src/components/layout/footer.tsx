import Link from "next/link";
import {
  BookOpen,
  HelpCircle,
  Info,
  LayoutList,
  Map,
  MapPin,
  MessageSquareWarning,
  Phone,
  ShieldAlert,
  Siren,
  Database,
  type LucideIcon,
} from "lucide-react";
import { Mark } from "@/components/site/mark";
import { EmergencyButton } from "./emergency-button";

type FooterLink = { href: string; label: string; icon: LucideIcon };

const EXPLORE: FooterLink[] = [
  { href: "/#cek", label: "Cek risiko wilayah", icon: MapPin },
  { href: "/peta", label: "Peta risiko", icon: Map },
  { href: "/rencana", label: "Rencana siaga", icon: LayoutList },
  { href: "/laporan", label: "Laporan warga", icon: MessageSquareWarning },
];

const ABOUT: FooterLink[] = [
  { href: "/#cara", label: "Cara kerja", icon: BookOpen },
  { href: "/peringatan", label: "Peringatan dini", icon: ShieldAlert },
  { href: "/tentang", label: "Tentang & metodologi", icon: Info },
  { href: "/#data", label: "Sumber data", icon: Database },
];

const HELP: FooterLink[] = [
  { href: "tel:112", label: "Telepon 112", icon: Phone },
  { href: "/#tanya", label: "Pertanyaan umum", icon: HelpCircle },
];

function LinkList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="sk-footer__col">
      <h3>{title}</h3>
      <ul>
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            {href.startsWith("tel:") ? (
              <a href={href}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            ) : (
              <Link href={href}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The page's close and footer on one dark-blue band: the one primary action, the brand and the link
 * columns on the plain sky, then the legal line, over a decorative Jakarta illustration.
 */
export function Footer() {
  return (
    <footer className="sk-footer" aria-labelledby="close-h">
      <div className="wrap sk-footer__inner">
        <div className="sk-footer__cta">
          <h2 id="close-h">Siap sebelum hujan turun.</h2>
          <p>
            Cek risiko wilayahmu hari ini, lalu susun rencana siaga keluarga.
            Gratis, tanpa akun, dan tidak meminta data pribadi.
          </p>
          <Link className="btn btn--primary btn--xl" href="/#cek">
            Cek risiko wilayah
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </Link>
        </div>

        <div className="sk-footer__main">
          <div className="sk-footer__brand">
            <Link
              className="nav__logo"
              href="/"
              aria-label="SiagaKU, ke beranda"
            >
              <Mark />
              SiagaKU
            </Link>
            <p className="sk-footer__lede">
              Informasi risiko banjir dan rencana siaga untuk warga Jakarta.
            </p>
            <EmergencyButton className="sk-footer__sos">
              <Siren size={16} aria-hidden="true" />
              Darurat 112
            </EmergencyButton>
          </div>
          <nav className="sk-footer__cols" aria-label="Tautan footer">
            <LinkList title="Jelajahi" links={EXPLORE} />
            <LinkList title="Informasi" links={ABOUT} />
            <LinkList title="Bantuan" links={HELP} />
          </nav>
        </div>

        <div className="sk-footer__legal">
          <span>© 2026 SiagaKU · IT RUSH 2026</span>
          <span>Bukan peringatan resmi. Ikuti BMKG dan BPBD DKI Jakarta.</span>
        </div>
      </div>

      <picture className="sk-footer__art">
        <source
          media="(max-width: 767px)"
          srcSet="/images/footer-jakarta-960.webp"
        />
        {/* a plain img: two hand-made sizes, decorative, below the fold */}
        <img
          src="/images/footer-jakarta.webp"
          alt=""
          width={1920}
          height={823}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </footer>
  );
}

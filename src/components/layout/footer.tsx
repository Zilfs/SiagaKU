import Link from "next/link";
import { Mark } from "@/components/site/mark";
import { EmergencyButton } from "./emergency-button";

const PAGES = [
  { href: "/#cek", label: "Cek risiko wilayah" },
  { href: "/peta", label: "Peta risiko" },
  { href: "/#cara", label: "Cara kerja" },
  { href: "/#data", label: "Sumber data" },
];

/**
 * The page's close and footer in one: the one primary action, the name across the ground, then the
 * links. `footer--statement` puts the slab on the page's lit ground (sky); `close--word` sets the name.
 */
export function Footer() {
  return (
    <footer className="footer closing footer--statement" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--word">
          <div className="section-head">
            <h2 id="close-h">Siap sebelum hujan turun.</h2>
            <p>
              Cek risiko wilayahmu hari ini, lalu susun rencana siaga keluarga.
              Gratis, tanpa akun, dan tidak meminta data pribadi.
            </p>
          </div>
          <Link className="btn btn--primary btn--xl" href="/#cek">
            Cek risiko wilayah
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </Link>
          <p className="close__word">SiagaKU</p>
        </div>

        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-5">
              <Link className="nav__logo" href="/" aria-label="SiagaKU, ke beranda">
                <Mark />
                SiagaKU
              </Link>
              <p className="footer__lede">
                Informasi risiko banjir dan rencana siaga untuk warga Jakarta.
              </p>
            </div>
            <div className="span-3 start-6 footer__col">
              <h4>Halaman</h4>
              <ul>
                {PAGES.map((page) => (
                  <li key={page.href}>
                    <Link href={page.href}>{page.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="span-3 start-10 footer__col">
              <h4>Darurat</h4>
              <ul>
                <li>
                  <EmergencyButton className="footer__button">
                    Darurat 112
                  </EmergencyButton>
                </li>
                <li>
                  <a href="tel:112">Telepon 112</a>
                </li>
                <li>
                  <Link href="/#tanya">Pertanyaan umum</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>© 2026 SiagaKU · IT RUSH 2026</span>
            <span>Data contoh, bukan peringatan resmi.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

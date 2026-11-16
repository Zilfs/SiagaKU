"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Siren, X } from "lucide-react";
import { Mark } from "@/components/site/mark";
import { EmergencyButton } from "./emergency-button";

const LINKS: { href: string; label: string; optional?: boolean }[] = [
  { href: "/#cek", label: "Cek risiko" },
  { href: "/peta", label: "Peta" },
  { href: "/rencana", label: "Rencana" },
  { href: "/#cara", label: "Cara kerja", optional: true },
  { href: "/#fitur", label: "Fitur", optional: true },
  { href: "/tanya", label: "Tanya" },
  { href: "/lapor", label: "Lapor" },
];

/**
 * One fixed, light glass bar on the page's .wrap (nav-centre): the words in the middle, the red 112
 * button and the one primary action on the right line, and a sheet on a phone.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", open);
    return () => document.body.classList.remove("nav-locked");
  }, [open]);

  return (
    <header className={open ? "nav nav--centre is-open" : "nav nav--centre"}>
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Lewati ke isi
        </a>
        <Link className="nav__logo" href="/" aria-label="SiagaKU, ke beranda">
          <Mark />
          SiagaKU
        </Link>
        <nav className="nav__links" id="menu-utama" aria-label="Utama">
          {LINKS.map((link) => (
            <div
              className={
                link.optional ? "nav__item nav__item--optional" : "nav__item"
              }
              key={link.href}
            >
              <Link
                className="nav__link"
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="nav__actions">
          <EmergencyButton className="nav__sos">
            <Siren size={16} aria-hidden="true" />
            Darurat 112
          </EmergencyButton>
          <Link
            className="btn btn--primary"
            href="/#cek"
            onClick={() => setOpen(false)}
          >
            Cek risiko wilayah
          </Link>
        </div>
        <button
          className="nav__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="menu-utama"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X size={18} aria-hidden="true" />
          ) : (
            <Menu size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}

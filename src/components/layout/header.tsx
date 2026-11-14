"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Mark } from "@/components/site/mark";
import { EmergencyButton } from "./emergency-button";

const LINKS = [
  { href: "/#cek", label: "Cek risiko" },
  { href: "/peta", label: "Peta" },
  { href: "/#cara", label: "Cara kerja" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#tanya", label: "Tanya" },
];

/**
 * One fixed, opaque bar on the page's .wrap (nav-centre): the words in the middle, the one primary
 * action on the right line, and a sheet on a phone.
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
            <div className="nav__item" key={link.href}>
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
          <EmergencyButton />
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

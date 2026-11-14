import {
  Backpack,
  Camera,
  CloudRain,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { HeroCollage } from "@/components/site/hero-collage";
import { DistrictSearch } from "@/features/risk/components/district-search";
import { RiskBadge } from "@/components/risk-badge";
import { listDistrictsWithScore } from "@/features/risk/server/risk-service";
import type { DistrictSummary } from "@/features/risk/types";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/risk/level";
import { connection } from "next/server";

const LEGEND: { level: RiskLevel; range: string; dot: string }[] = [
  { level: "low", range: "0–24", dot: "var(--risk-low)" },
  { level: "moderate", range: "25–49", dot: "var(--risk-moderate)" },
  { level: "high", range: "50–74", dot: "var(--risk-high)" },
  { level: "very_high", range: "75–100", dot: "var(--risk-very-high)" },
];

const STEPS = [
  {
    title: "Pilih kecamatanmu",
    body: "Ketik nama kecamatan di kolom pencarian. Tidak perlu akun, dan tidak ada data pribadi yang diminta.",
  },
  {
    title: "Baca skor dan sumbernya",
    body: "Setiap angka menyebut waktu pembaruan, prakiraan hujan tiga hari, dan komponen yang menyusunnya.",
  },
  {
    title: "Susun rencana siaga",
    body: "Pilih anggota keluarga, lalu simpan daftar periksa yang sudah disesuaikan dengan kebutuhan mereka.",
  },
];

const SOURCES = [
  {
    name: "BMKG",
    note: "Prakiraan hujan dan peringatan dini cuaca.",
    tag: "tiap jam",
  },
  {
    name: "Open-Meteo",
    note: "Curah hujan harian tiga hari ke depan per titik kecamatan.",
    tag: "tiap jam",
  },
  {
    name: "BPBD DKI Jakarta",
    note: "Daftar kelurahan rawan dan riwayat kejadian banjir.",
    tag: "saat seeding",
  },
  {
    name: "BNPB",
    note: "Buku saku kesiapsiagaan untuk tindakan utama yang ditampilkan.",
    tag: "pedoman",
  },
];

const FAQ = [
  {
    q: "Apakah SiagaKU peringatan resmi?",
    a: "Bukan. SiagaKU membantu persiapan. Untuk peringatan resmi, ikuti BMKG, BPBD DKI Jakarta, dan pemerintah daerah.",
  },
  {
    q: "Dari mana angka risiko di halaman ini?",
    a: "Skor dihitung dari 0,55 kerawanan dasar ditambah 0,45 faktor hujan. Datanya dari BMKG, Open-Meteo, BPBD DKI, dan BNPB, dan setiap angka menyebut waktu pembaruan.",
  },
  {
    q: "Apakah saya perlu akun?",
    a: "Tidak. Tidak ada login, dan formulir tidak meminta nama, alamat, atau nomor telepon.",
  },
  {
    q: "Bagaimana kalau air sudah masuk rumah?",
    a: "Hubungi 112 sekarang. Jangan menunggu pembaruan di halaman ini, dan ikuti arahan petugas di lokasi.",
  },
];

export default async function HomePage() {
  // live data: the request is rendered per visit (the service caches its own upstream calls)
  await connection();
  let districts: DistrictSummary[] = [];
  try {
    districts = await listDistrictsWithScore();
  } catch (error) {
    console.error("GET districts for the landing failed", error);
    districts = [];
  }
  return (
    <>
      <section
        className="hero hero--triptych sk-hero"
        data-enter
        aria-labelledby="hero-h"
      >
        <div className="wrap">
          <div className="hero-text grid hero__grid">
            <div className="span-3">
              <p className="sk-eyebrow sk-hero__eyebrow">
                Mitigasi banjir · DKI Jakarta
              </p>
              <h1 id="hero-h">Risiko banjir Jakarta, tiap kecamatan.</h1>
              <p className="hero__lead">
                Cek skor risiko wilayahmu hari ini, lihat dari mana angkanya,
                lalu susun rencana siaga keluarga. Tanpa akun dan tanpa data
                pribadi.
              </p>
            </div>

            <HeroCollage className="span-6" />

            <div className="span-3 hero__cta">
              <div className="sk-hero__cta">
                <a className="btn btn--primary" href="#cek">
                  Cek risiko wilayah
                </a>
                <ul className="sk-hero__proof" aria-label="Cakupan dan sumber data">
                  <li>
                    <b>44</b> kecamatan
                  </li>
                  <li>
                    <b>3 hari</b> BMKG
                  </li>
                  <li>
                    <b>112</b> darurat
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="cek" aria-labelledby="cek-h">
        <div className="wrap">
          <div className="section-head section-head--split">
            <div>
              <h2 id="cek-h">Cari kecamatanmu, lihat risiko banjirnya.</h2>
              <p>
                Skor 0–100 dari kerawanan dasar dan prakiraan hujan tiga hari.
                Jawabannya di atas, rinciannya tepat di bawahnya.
              </p>
            </div>
            <ul className="sk-legend" aria-label="Arti level risiko">
              {LEGEND.map((item) => (
                <li key={item.level}>
                  <span
                    className="sk-dot"
                    style={{ background: item.dot }}
                    aria-hidden="true"
                  />
                  {RISK_LEVEL_LABELS[item.level]} {item.range}
                </li>
              ))}
            </ul>
          </div>
          <div className="sk-fill">
            <DistrictSearch districts={districts} />
          </div>
        </div>
      </section>

      <section className="section g2" id="fitur" aria-labelledby="fitur-h">
        <div className="wrap">
          <div className="group">
            <div className="section-head">
              <h2 id="fitur-h">Empat fitur di atas satu data risiko banjir.</h2>
              <p>
                Semua fitur memakai data yang sama, jadi tidak saling
                bertentangan.
              </p>
            </div>
            <div className="grid">
              <article className="card span-6">
                <h3>
                  <span className="sk-card-index">01</span>Risiko tiap kecamatan
                </h3>
                <p>Satu skor per kecamatan Jakarta.</p>
                <div className="panel">
                  <div className="sk-feature" data-ui>
                    <div className="sk-feature__head">
                      <span className="sk-feature__title">
                        <MapPin size={14} aria-hidden="true" />
                        Jakarta hari ini
                      </span>
                      <span className="sk-feature__meta">14.00</span>
                    </div>
                    <div className="sk-feature__row">
                      <b>Awas</b>
                      <span>3 kecamatan</span>
                    </div>
                    <div className="sk-feature__row">
                      <b>Siaga</b>
                      <span>9 kecamatan</span>
                    </div>
                    <div className="sk-feature__row">
                      <b>Waspada</b>
                      <span>18 kecamatan</span>
                    </div>
                    <div className="sk-feature__row">
                      <b>Normal</b>
                      <span>14 kecamatan</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="card span-6">
                <h3>
                  <span className="sk-card-index">02</span>Rencana siaga banjir
                </h3>
                <p>Daftar periksa per anggota keluarga.</p>
                <div className="panel">
                  <div className="sk-feature" data-ui>
                    <div className="sk-feature__head">
                      <span className="sk-feature__title">
                        <Backpack size={14} aria-hidden="true" />
                        Tas siaga
                      </span>
                      <span className="sk-feature__meta">8/22</span>
                    </div>
                    <ul>
                      <li className="is-done">
                        <span className="sk-check" aria-hidden="true" />
                        Air minum 3 L per orang
                      </li>
                      <li className="is-done">
                        <span className="sk-check" aria-hidden="true" />
                        Dokumen di kantong tahan air
                      </li>
                      <li>
                        <span className="sk-check" aria-hidden="true" />
                        Obat rutin 7 hari untuk lansia
                      </li>
                      <li>
                        <span className="sk-check" aria-hidden="true" />
                        Susu formula dan botol bayi
                      </li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="group">
            <div className="grid">
              <article className="card span-6">
                <h3>
                  <span className="sk-card-index">03</span>Tanya soal banjir
                </h3>
                <p>
                  Jawaban bahasa sehari-hari dari pedoman BNPB, BPBD, dan
                  Kementerian Kesehatan, dengan sumber di tiap jawaban.
                </p>
                <div className="panel">
                  <div className="sk-feature" data-ui>
                    <div className="sk-feature__head">
                      <span className="sk-feature__title">
                        <MessageCircle size={14} aria-hidden="true" />
                        Tanya SiagaKU
                      </span>
                      <span className="sk-tag sk-tag--ai">AI · contoh</span>
                    </div>
                    <p className="sk-feature__q">
                      <span className="sk-feature__bubble">
                        Kapan harus mengungsi kalau ada lansia?
                      </span>
                    </p>
                    <div className="sk-feature__answer">
                      Untuk keluarga dengan lansia, bersiap lebih awal: saat air
                      mulai naik di gang, bukan saat masuk rumah.
                      <span className="sk-feature__src">
                        BNPB · Buku Saku, hlm. 23
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="card span-6">
                <h3>
                  <span className="sk-card-index">04</span>Lapor banjir
                </h3>
                <p>
                  Kirim foto dan tinggi air. Laporan warga melengkapi data
                  resmi, bukan menggantikannya.
                </p>
                <div className="panel">
                  <div className="sk-feature" data-ui>
                    <div className="sk-feature__head">
                      <span className="sk-feature__title">
                        <Camera size={14} aria-hidden="true" />
                        Laporan warga
                      </span>
                      <span className="sk-feature__meta">12 menit lalu</span>
                    </div>
                    <div className="sk-feature__upload">
                      <Camera size={20} aria-hidden="true" />
                      Foto genangan, tinggi air, dan patokan jalan
                    </div>
                    <div className="sk-feature__status">
                      <CloudRain size={14} aria-hidden="true" />
                      Terkirim · 3 laporan di Jatinegara hari ini
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="cara" aria-labelledby="cara-h">
        <div className="wrap">
          <div className="sk-split">
            <div className="sk-split__copy">
              <div className="section-head">
                <h2 id="cara-h">
                  Dari risiko ke rencana siaga, dalam tiga langkah.
                </h2>
                <p>
                  Kamu tidak perlu membaca semua data. Tiga langkah ini cukup
                  untuk tahu apa yang harus disiapkan malam ini.
                </p>
              </div>
              <ol className="sk-steps">
                {STEPS.map((step) => (
                  <li key={step.title}>
                    <div>
                      <b>{step.title}</b>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sk-plan" data-ui>
              <div className="sk-plan__head">
                <b>Rencana siaga · Jatinegara</b>
                <span>8 dari 22 selesai</span>
              </div>
              <div className="sk-plan__progress">
                <span className="sk-track" aria-hidden="true">
                  <i />
                </span>
                <p>
                  <span>36% selesai</span>
                  <span>Data contoh</span>
                </p>
              </div>
              <ul>
                <li className="is-done">
                  <span className="sk-check" aria-hidden="true" />
                  Air minum 3 L per orang, 3 hari
                  <em>6 botol</em>
                </li>
                <li className="is-done">
                  <span className="sk-check" aria-hidden="true" />
                  Dokumen di kantong tahan air
                  <em>KK, KTP</em>
                </li>
                <li>
                  <span className="sk-check" aria-hidden="true" />
                  Obat rutin 7 hari untuk lansia
                  <em>7 hari</em>
                </li>
                <li>
                  <span className="sk-check" aria-hidden="true" />
                  Lampu senter dan baterai cadangan
                  <em>2 buah</em>
                </li>
                <li>
                  <span className="sk-check" aria-hidden="true" />
                  Jalur keluar dan titik aman keluarga
                  <em>1 titik</em>
                </li>
              </ul>
              <div className="sk-plan__foot">
                <span>Diperbarui 14.00 WIB</span>
                <a className="link" href="#cek">
                  Buat rencana
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="data" aria-labelledby="data-h">
        <div className="wrap">
          <div className="sk-split">
            <div className="sk-split__copy">
              <div className="section-head">
                <h2 id="data-h">Sumber data risiko banjir Jakarta.</h2>
                <p>
                  SiagaKU tidak menebak. Setiap skor memakai prakiraan hujan
                  resmi dan riwayat kejadian, dan setiap baris menyebut kapan
                  terakhir diperbarui.
                </p>
              </div>
              <ul className="sk-source-list">
                {SOURCES.map((source) => (
                  <li key={source.name}>
                    <b>{source.name}</b>
                    <p>{source.note}</p>
                    <span>{source.tag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sk-formula" data-ui>
              <div className="sk-formula__head">
                <b>Cara skor dihitung</b>
                <span>0–100</span>
              </div>
              <ul className="sk-bars">
                <li className="sk-bar">
                  <span>Kerawanan dasar</span>
                  <span className="sk-mono">bobot 0,55</span>
                  <span className="sk-bar__track" aria-hidden="true">
                    <i style={{ width: "55%" }} />
                  </span>
                </li>
                <li className="sk-bar">
                  <span>Faktor hujan</span>
                  <span className="sk-mono">bobot 0,45</span>
                  <span className="sk-bar__track" aria-hidden="true">
                    <i style={{ width: "45%" }} />
                  </span>
                </li>
              </ul>
              <p className="t-small muted">
                Kerawanan dasar menghitung frekuensi banjir lima tahun terakhir,
                daftar kelurahan rawan BPBD, dan risiko rob di wilayah pesisir.
                Faktor hujan memakai curah hujan terbesar dalam tiga hari ke
                depan.
              </p>
              <ul className="sk-legend">
                {LEGEND.map((item) => (
                  <li key={item.level}>
                    <span
                      className="sk-dot"
                      style={{ background: item.dot }}
                      aria-hidden="true"
                    />
                    <RiskBadge level={item.level} size="sm" />
                    <span className="sk-mono">{item.range}</span>
                  </li>
                ))}
              </ul>
              <p className="sk-mono t-small muted">
                skor = round(0,55 × kerawanan + 0,45 × hujan)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="tanya" aria-labelledby="tanya-h">
        <div className="wrap">
          <div className="sk-ask">
            <div>
              <div className="section-head">
                <h2 id="tanya-h">Pertanyaan warga soal risiko banjir.</h2>
                <p>
                  Empat hal yang paling sering ditanyakan warga sebelum memakai
                  SiagaKU.
                </p>
              </div>
              <div className="faq">
                {FAQ.map((item) => (
                  <details key={item.q} open>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="sk-call">
              <span className="sk-call__glyph" aria-hidden="true">
                <Phone size={26} />
              </span>
              <span className="sk-tag">
                <Phone size={13} aria-hidden="true" />
                Darurat
              </span>
              <b className="sk-call__num">112</b>
              <p>
                Gratis 24 jam dari telepon dan ponsel. Untuk air yang sudah
                masuk rumah atau ada orang terjebak.
              </p>
              <a className="btn btn--primary" href="tel:112">
                Telepon 112
              </a>
              <span className="sk-mono">Jakarta Siaga · 24 jam</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// live data: the route waits for the request (no instant shell)
export const instant = false;

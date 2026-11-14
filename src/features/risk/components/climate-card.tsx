import { CloudRainWind } from "lucide-react";

/**
 * T16, cut to a static card: two sentences on extreme rain and tidal flood, with the source named.
 * No chart, no generated narrative (docs/13, Task 16).
 */
export function ClimateCard() {
  return (
    <section className="sk-card sk-climate" aria-labelledby="iklim-h">
      <div className="sk-card__head">
        <h2 id="iklim-h">Konteks iklim</h2>
        <CloudRainWind size={18} aria-hidden="true" />
      </div>
      <p>
        Hujan ekstrem makin sering turun dalam waktu singkat, sementara rob
        makin sering masuk ke kampung pesisir Jakarta. Dua hal ini membuat
        genangan bisa datang lebih cepat dari biasanya.
      </p>
      <p className="sk-mono t-small muted">
        Sumber:{" "}
        <a href="https://www.bmkg.go.id/iklim/" target="_blank" rel="noreferrer">
          BMKG · Informasi Iklim Indonesia
        </a>
      </p>
    </section>
  );
}

import { Phone, TriangleExclamationPoint } from "lucide-react";

/** The emergency card travels with the answer whenever the chat detects a danger phrase. */
export function EmergencyCard() {
  return (
    <div className="sk-chat-emergency" role="alert">
      <span className="sk-chat-emergency__icon" aria-hidden="true">
        <TriangleExclamationPoint size={18} />
      </span>
      <div>
        <b>Dalam bahaya? Hubungi 112 sekarang.</b>
        <p>
          Layanan Jakarta Siaga, gratis 24 jam. Jangan menunggu jawaban chat
          kalau air sudah masuk rumah atau ada orang terjebak.
        </p>
      </div>
      <a className="btn btn--primary" href="tel:112">
        <Phone size={15} aria-hidden="true" />
        Telepon 112
      </a>
    </div>
  );
}

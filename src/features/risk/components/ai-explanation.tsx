"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type ExplanationResponse = {
  explanation?: string;
  mainAction?: string;
  meta?: { provider?: string; fallback?: boolean };
};

type State = {
  id: number;
  data: ExplanationResponse | null;
  loading: boolean;
};

/**
 * Why the score is what it is, in plain Indonesian. The AI route is fetched after mount: the card
 * shows a short skeleton, then the answer (or the page's template line when the route is down).
 */
export function AiExplanation({
  districtId,
  districtName,
  fallback,
}: {
  districtId: number;
  districtName: string;
  fallback: string;
}) {
  const [state, setState] = useState<State>({
    id: districtId,
    data: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/risk/${districtId}/explanation`)
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (!cancelled) {
          setState({ id: districtId, data: result, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ id: districtId, data: null, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [districtId]);

  const data = state.id === districtId ? state.data : null;
  const loading = state.id !== districtId || state.loading;
  const isAi = Boolean(data?.meta?.provider && data.meta.provider !== "template");

  return (
    <section
      className="sk-card sk-explain"
      aria-labelledby="jelas-h"
      aria-busy={loading}
    >
      <div className="sk-card__head">
        <h2 id="jelas-h">Kenapa {districtName}?</h2>
        {isAi ? (
          <span className="sk-tag sk-tag--ai">
            <Sparkles size={12} aria-hidden="true" />
            Penjelasan AI
          </span>
        ) : (
          <span className="sk-mono">Penjelasan</span>
        )}
      </div>
      <p aria-live="polite">
        {data?.explanation ?? (loading ? "Menyusun penjelasan…" : fallback)}
      </p>
    </section>
  );
}

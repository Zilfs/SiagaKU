/** One cloud, 240 x 80 on its own baseline; the sky draws it three times at different sizes. */
const CLOUD =
  "M20 80a28 28 0 0 1 6-55a40 40 0 0 1 74-12a34 34 0 0 1 60 6a32 32 0 0 1 52 30a26 26 0 0 1 8 31z";

/** Towers behind the skyline, in the lighter far tone. */
const FAR_TOWERS =
  "M30 300V180h50v120zM100 300V130h40v170zM240 300V100h30v200zM380 300V150h40v150zM520 300V160h50v140zM600 300V200h60v100zM780 300V190h60v110zM900 300V140h50v160zM1060 300V90h40v210zM1200 300V150h50v150zM1330 300V120h40v180zM1400 300V170h40v130z";

/** The near skyline: towers either side of Monas, low roofs around it so it stands alone. */
const NEAR_TOWERS =
  "M0 300V240h50v60zM60 300V210h60v90zM140 300V150h50v150zM163 150v-32h4v32zM205 300V190h55v110zM275 300V135h10v-15h35v15h10v165zM350 300V175h60v125zM425 300V140q25-22 50 0v160zM490 300V200h70v100zM580 300V250h50v50zM810 300V245h50v55zM880 300V180h60v120zM955 300V110l30-15 30 15v190zM983 95V70h4v25zM1030 300V160h60v140zM1105 300V200h45v100zM1165 300V130h65v170zM1245 300V185h55v115zM1315 300V215h65v85zM1390 300V240h50v60z";

/** Monas: the wide cawan platform on its plinth, the slender tapering obelisk, the small top lantern. */
const MONAS =
  "M640 300v-14h160v14zM676 286l-24-24h136l-24 24zM708 262l7-166h10l7 166zM712 96l-2-10h20l-2 10z";

/** Monas's flame: a teardrop on the lantern, gold rather than a crossbar. */
const FLAME = "M713 86c-2-12 3-20 7-36c4 16 9 24 7 36z";

/** The water's surface: a gentle wave across the band. */
const WAVE =
  "M0 30C120 10 240 10 360 30S600 50 720 30S960 10 1080 30S1320 50 1440 30";

/**
 * The landing hero's sky, drawn as three inline SVG layers (clouds, the Jakarta skyline with
 * Monas, the water line). Decorative only. globals.css moves them at different speeds on
 * scroll (.sk-sky__layer) and keeps them still where scroll timelines or motion are off.
 */
export function HeroSky() {
  return (
    <div className="sk-sky__layers" aria-hidden="true">
      <svg
        className="sk-sky__layer sk-sky__clouds"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMin slice"
        focusable="false"
      >
        <defs>
          <path id="sk-cloud" d={CLOUD} />
        </defs>
        <use href="#sk-cloud" transform="translate(90 150) scale(1.1)" />
        <use href="#sk-cloud" transform="translate(1010 70) scale(1.45)" />
        <use href="#sk-cloud" transform="translate(600 290) scale(0.75)" />
      </svg>
      <svg
        className="sk-sky__layer sk-sky__city"
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <path className="sk-sky__far" d={FAR_TOWERS} />
        <path className="sk-sky__near" d={NEAR_TOWERS} />
        <path className="sk-sky__near" d={MONAS} />
        <path className="sk-sky__flame" d={FLAME} />
      </svg>
      <div className="sk-sky__layer sk-sky__water">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" focusable="false">
          <path className="sk-sky__sea" d={`${WAVE}V60H0z`} />
          <path className="sk-sky__crest" d={WAVE} />
        </svg>
      </div>
    </div>
  );
}

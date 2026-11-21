import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/* ------------------------------------------------------------------
   1. COPY the "nalangu" folder from the zip into:  public/images/nalangu/
   2. Edit titles / captions below if you want different words.
   3. Use it anywhere:  <Nalangu />
------------------------------------------------------------------- */
const BASE = "/images/nalangu/";
const EVENT_DATE = "21 November 2026";

// story order = order in the full-screen viewer. `hero: true` = the big opening photo.
const STORY = [
  { id: "p07", type: "photo", src: "nalangu-07.jpg", w: 899, h: 1599, title: "Adorned with love", text: "Fresh jasmine garlands and a gentle blessing from an elder.", alt: "Bride in a golden silk saree being adorned with a jasmine garland" },
  { id: "p02", type: "photo", src: "nalangu-02.jpg", w: 720, h: 1280, title: "The procession begins", text: "Family and neighbours walk along, smiling all the way.", alt: "Bride walking in a procession with family through the street" },
  { id: "p01", type: "photo", src: "nalangu-01.jpg", w: 960, h: 1280, title: "Carried with joy", text: "Laughter everywhere as the celebration spills onto the street.", alt: "Bride being carried joyfully while family laughs behind" },
  { id: "p05", type: "photo", src: "nalangu-05.jpg", w: 1280, h: 960, title: "Blessings, together", text: "Hands joined over plates of fruits, flowers and coconut. Blessings from every side.", alt: "Family joining hands over plates of offerings during the ceremony", hero: true },
  { id: "p06", type: "photo", src: "nalangu-06.jpg", w: 1280, h: 960, title: "Tradition, handed down", text: "Elders and loved ones gather close for a quiet moment of prayer.", alt: "Elders joining hands in blessing during Nalangu" },
  { id: "p08", type: "photo", src: "nalangu-08.jpg", w: 1280, h: 960, title: "Offerings, carried with care", text: "Coconuts, bananas, flowers and a fresh silk saree.", alt: "Plates of coconuts, bananas, flowers and a silk saree" },
  { id: "p03", type: "photo", src: "nalangu-03.jpg", w: 960, h: 1280, title: "Family, all smiles", text: "The people who matter most, together in one frame.", alt: "Family standing together smiling under a green canopy" },
  { id: "p04", type: "photo", src: "nalangu-04.jpg", w: 960, h: 1280, title: "Three smiles, one frame", text: "A warm moment in the courtyard.", alt: "Three people posing together in a courtyard" },
  { id: "v01", type: "video", src: "nalangu-video.mp4", poster: "nalangu-video-poster.jpg", w: 478, h: 850, title: "Moments in motion", text: "A little glimpse of the day, just as it happened." },
];

const HERO = STORY.find((s) => s.hero);
const GRID_ITEMS = STORY.filter((s) => !s.hero);
const url = (f) => BASE + f;
const EASE = [0.22, 1, 0.36, 1];

const up = (d = 0) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, delay: d, ease: EASE },
});

/* ---------- animation sets (swapped for a calm fade if the visitor prefers reduced motion) ---------- */
const makeV = (reduce) =>
  reduce
    ? {
        tile: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } },
        img: { hidden: {}, show: {}, hover: {} },
        cap: { hidden: { opacity: 0 }, show: { opacity: 1 } },
        desc: { hidden: { opacity: 0 }, show: { opacity: 0 }, hover: { opacity: 1 } },
      }
    : {
        // picture "unrolls" from the top, lands with a slight lift
        tile: {
          hidden: { clipPath: "inset(0 0 100% 0 round 22px)", y: 50 },
          show: (i = 0) => ({
            clipPath: "inset(0 0 0% 0 round 22px)",
            y: 0,
            transition: { duration: 1.1, ease: EASE, delay: (i % 3) * 0.08 },
          }),
        },
        // photo settles from a zoomed-in state; grows slightly on hover
        img: {
          hidden: { scale: 1.35 },
          show: { scale: 1, transition: { duration: 1.8, ease: EASE } },
          hover: { scale: 1.06, transition: { duration: 0.8, ease: EASE } },
        },
        cap: {
          hidden: { opacity: 0, y: 22 },
          show: { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.8, ease: EASE } },
        },
        desc: {
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 0, y: 8 },
          hover: { opacity: 1, y: 0, transition: { duration: 0.35 } },
        },
      };

/* ---------- column count (1 / 2 / 3) ---------- */
function useCols() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const f = () => setCols(window.innerWidth < 600 ? 1 : window.innerWidth < 980 ? 2 : 3);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return cols;
}

// put each photo into the currently shortest column so columns stay balanced
function splitIntoColumns(items, n) {
  const cols = Array.from({ length: n }, () => ({ h: 0, items: [] }));
  items.forEach((it) => {
    const c = cols.reduce((a, b) => (b.h < a.h ? b : a));
    c.items.push(it);
    c.h += it.h / it.w;
  });
  return cols.map((c) => c.items);
}

/* ---------- HERO ---------- */
function Hero({ item, onOpen, reduce }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

  return (
    <div className="nl-shadow nl-hero-wrap">
      <motion.figure
        ref={ref}
        className="nl-hero"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, clipPath: "inset(14% 10% 14% 10% round 30px)" }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 30px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.3, ease: EASE }}
        onClick={() => onOpen(STORY.indexOf(item))}
      >
        <motion.img
          src={url(item.src)}
          alt={item.alt}
          style={reduce ? undefined : { y, scale: 1.2 }}
          draggable={false}
        />
        <div className="nl-hero-shade" />
        <motion.figcaption
          className="nl-hero-cap"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
        >
          <span className="nl-kicker">{EVENT_DATE}</span>
          <h3 className="script gold-text">{item.title}</h3>
          <p className="serif">{item.text}</p>
        </motion.figcaption>
        <span className="nl-zoom" aria-hidden="true">⤢</span>
      </motion.figure>
    </div>
  );
}

/* ---------- TILE ---------- */
function Tile({ item, index, onOpen, V, reduce }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const isVideo = item.type === "video";

  // the preview video plays silently only while it is on screen
  useEffect(() => {
    if (!isVideo) return;
    const v = ref.current?.querySelector("video");
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView, isVideo]);

  const storyIndex = STORY.indexOf(item);

  return (
    <div className="nl-shadow">
      <motion.figure
        ref={ref}
        className="nl-tile"
        style={{ aspectRatio: `${item.w} / ${item.h}` }}
        variants={V.tile}
        initial="hidden"
        whileInView="show"
        whileHover="hover"
        viewport={{ once: true, amount: 0.2, margin: "0px 0px -40px 0px" }}
        custom={index}
        onClick={() => onOpen(storyIndex)}
      >
        {isVideo ? (
          <motion.video
            className="nl-media"
            src={url(item.src)}
            poster={url(item.poster)}
            muted
            loop
            playsInline
            preload="metadata"
            variants={V.img}
          />
        ) : (
          <motion.img
            className="nl-media"
            src={url(item.src)}
            alt={item.alt}
            loading="lazy"
            draggable={false}
            variants={V.img}
          />
        )}

        <span className="nl-idx">{String(storyIndex + 1).padStart(2, "0")}</span>

        {isVideo && (
          <span className="nl-play" aria-hidden="true">
            {!reduce && <i className="nl-play-ring" />}
            <b>▶</b>
          </span>
        )}

        <div className="nl-tile-shade" />
        <motion.figcaption className="nl-tile-cap" variants={V.cap}>
          <h4 className="serif">{item.title}</h4>
          <motion.p variants={V.desc}>{item.text}</motion.p>
        </motion.figcaption>
      </motion.figure>
    </div>
  );
}

/* ---------- FULL-SCREEN VIEWER ---------- */
const slideV = {
  enter: (d) => ({ opacity: 0, x: d === 0 ? 0 : d > 0 ? 90 : -90, scale: 0.94 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
  exit: (d) => ({ opacity: 0, x: d > 0 ? -90 : 90, scale: 0.94, transition: { duration: 0.25 } }),
};

function Lightbox({ index, dir, onClose, onGo }) {
  const item = STORY[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onGo(1);
      if (e.key === "ArrowLeft") onGo(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onGo]);

  const isVideo = item.type === "video";

  return (
    <motion.div
      className="nl-lb"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button className="nl-lb-close" onClick={onClose} aria-label="Close">✕</button>
      <button className="nl-lb-nav nl-lb-prev" onClick={(e) => { e.stopPropagation(); onGo(-1); }} aria-label="Previous">‹</button>
      <button className="nl-lb-nav nl-lb-next" onClick={(e) => { e.stopPropagation(); onGo(1); }} aria-label="Next">›</button>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={item.id}
          className="nl-lb-stage"
          custom={dir}
          variants={slideV}
          initial="enter"
          animate="center"
          exit="exit"
          drag={isVideo ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, { offset }) => {
            if (offset.x < -80) onGo(1);
            else if (offset.x > 80) onGo(-1);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              className="nl-lb-media"
              src={url(item.src)}
              poster={url(item.poster)}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img className="nl-lb-media" src={url(item.src)} alt={item.alt} draggable={false} />
          )}
          <div className="nl-lb-cap">
            <h3 className="gold-text">{item.title}</h3>
            <p className="serif">{item.text}</p>
            <small>{index + 1} / {STORY.length}</small>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- SECTION ---------- */
export default function Nalangu() {
  const [open, setOpen] = useState(null);
  const [dir, setDir] = useState(0);
  const openAt = (i) => { setDir(0); setOpen(i); };
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((d) => {
    setDir(d);
    setOpen((i) => (i === null ? null : (i + d + STORY.length) % STORY.length));
  }, []);

  return (
    <section id="nalangu" className="nl-section" style={{ paddingTop: 30, paddingBottom: 25, overflow: "hidden" }}>
      <style>{CSS}</style>
      <div className="wrap">
        <motion.p className="eyebrow" {...up()}>Nalangu · நலங்கு</motion.p>
        <motion.h2 className="title" {...up(0.1)}>
          Blessings, <span className="gold-text">Laughter</span> &amp; Love
        </motion.h2>
        <div className="divider" style={{ marginBottom: 18 }} />
        <motion.div className="nl-date-wrap" {...up(0.2)}>
          <span className="nl-date">✦ {EVENT_DATE} ✦</span>
        </motion.div>
      </div>

      {/* Continuous Auto-Scrolling Photo Reel */}
      <div className="nl-scroll-wrap">
        <div className="nl-scroll-track">
          {[...STORY, ...STORY].map((item, idx) => {
            const storyIndex = idx % STORY.length;
            const isVideo = item.type === "video";
            return (
              <div
                key={`${item.id}-${idx}`}
                className="nl-scroll-card"
                onClick={() => openAt(storyIndex)}
              >
                {isVideo ? (
                  <video
                    className="nl-scroll-media"
                    src={url(item.src)}
                    poster={url(item.poster)}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    className="nl-scroll-media"
                    src={url(item.src)}
                    alt={item.alt}
                    loading="lazy"
                  />
                )}
                <div className="nl-scroll-shade" />
                <div className="nl-scroll-cap">
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
                <span className="nl-scroll-idx">{String(storyIndex + 1).padStart(2, "0")}</span>
                {isVideo && <span className="nl-play-badge">▶ Video</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="wrap">
        <motion.p className="nl-hint serif" {...up(0.1)}>
          Tap any photo to view full screen ✦ auto-scrolls continuously
        </motion.p>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox key="lb" index={open} dir={dir} onClose={close} onGo={go} />}
      </AnimatePresence>
    </section>
  );
}

/* Only layout + neutral overlays. Colours come from YOUR existing variables. */
const CSS = `
.nl-section{ position:relative; overflow:hidden; }
.nl-date-wrap{ text-align:center; margin-bottom: 22px; }
.nl-date{
  display:inline-block; margin-top:4px; padding:7px 20px; border-radius:999px;
  border:1px solid var(--gold-soft, rgba(212,175,106,.4)); color:var(--gold);
  font:500 12px/1 'Poppins',sans-serif; letter-spacing:.22em; text-transform:uppercase;
}

/* horizontal auto-scrolling photo reel */
.nl-scroll-wrap {
  position: relative;
  width: 100vw;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  overflow: hidden;
  padding: 10px 0 6px;
  mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
}
.nl-scroll-wrap:hover .nl-scroll-track {
  animation-play-state: paused;
}
.nl-scroll-track {
  display: flex;
  gap: 20px;
  width: max-content;
  animation: nlAutoScroll 38s linear infinite;
  will-change: transform;
}
@keyframes nlAutoScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.nl-scroll-card {
  position: relative;
  flex: 0 0 290px;
  height: 390px;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(3, 18, 12, 0.7);
  border: 1px solid var(--gold-soft, rgba(212, 175, 106, 0.4));
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.35s ease;
  user-select: none;
}
.nl-scroll-card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: var(--gold);
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 106, 0.35);
}
.nl-scroll-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.nl-scroll-card:hover .nl-scroll-media {
  transform: scale(1.06);
}
.nl-scroll-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to top, rgba(3, 12, 8, 0.92) 0%, rgba(3, 12, 8, 0.25) 55%, transparent 100%);
}
.nl-scroll-cap {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  text-align: left;
}
.nl-scroll-cap h4 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--ivory);
  font-weight: 600;
  font-family: "Playfair Display", serif;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}
.nl-scroll-cap p {
  margin: 4px 0 0;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--gold-soft, #e2cfa7);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nl-scroll-idx {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  font: 500 11px/1 "Poppins", sans-serif;
  letter-spacing: 0.18em;
  color: var(--gold);
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(3, 12, 8, 0.7);
  border: 1px solid rgba(212, 175, 106, 0.35);
}
.nl-play-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  font: 600 11px/1 "Poppins", sans-serif;
  letter-spacing: 0.12em;
  color: #fff;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(212, 175, 106, 0.85);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
.nl-hint { text-align:center; margin:12px 0 0; color:var(--ivory-dim); font-style:italic; font-size: 0.95rem; }

/* viewer */
.nl-lb{
  position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:20px;
  background:rgba(3,12,8,.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
}
.nl-lb-stage{ display:flex; flex-direction:column; align-items:center; max-width:min(92vw,900px); touch-action:pan-y; }
.nl-lb-media{
  max-width:100%; max-height:70vh; width:auto; height:auto; border-radius:18px; object-fit:contain;
  border:1px solid var(--gold-soft, rgba(212,175,106,.4)); box-shadow:0 30px 80px rgba(0,0,0,.6); background:#000;
}
.nl-lb-cap{ text-align:center; margin-top:16px; max-width:560px; }
.nl-lb-cap h3{ margin:0 0 4px; font-size:clamp(22px,3.4vw,30px); }
.nl-lb-cap p{ margin:0 0 6px; color:var(--ivory-dim); }
.nl-lb-cap small{ color:var(--gold); letter-spacing:.2em; }
.nl-lb-close, .nl-lb-nav{
  position:absolute; z-index:2; width:46px; height:46px; display:grid; place-items:center; cursor:pointer;
  border-radius:50%; background:rgba(3,12,8,.6); color:var(--gold); font-size:22px; line-height:1;
  border:1px solid var(--gold-soft, rgba(212,175,106,.4));
}
.nl-lb-close{ top:16px; right:16px; font-size:18px; }
.nl-lb-nav{ top:50%; margin-top:-23px; font-size:30px; padding-bottom:4px; }
.nl-lb-prev{ left:14px; }
.nl-lb-next{ right:14px; }
@media (max-width:640px){
  .nl-scroll-card { flex: 0 0 230px; height: 320px; }
  .nl-lb-nav{ top:auto; bottom:18px; margin:0; }
  .nl-lb-prev{ left:22px; }
  .nl-lb-next{ right:22px; }
}
@media (prefers-reduced-motion:reduce){ .nl-scroll-track{ animation:none; overflow-x:auto; } }
`;
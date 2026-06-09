"use client";
/* =========================================================================
   SiteScrub — fixed full-page canvas that scrubs the V animation in
   lockstep with scroll.

   PRIMARY PATH: WebCodecs.
     - Fetches a single MP4 encoded from the RIFE-interpolated 96 fps
       frame ladder (source-desktop.mp4 / source-mobile.mp4) — same
       frames as the old WebP sequence, one request instead of 768.
     - MP4Box.js demuxes the H.264 stream into per-frame chunks.
     - The platform's hardware VideoDecoder decodes each chunk; every
       VideoFrame is copied to an ImageBitmap and closed immediately
       (decoder output pools are tiny — holding frames stalls decode).
     - Crossfade between adjacent frames synthesizes infinite intermediate
       states for silky slow-scroll smoothness.

   FALLBACK PATH: preloaded WebP frame sequence (older Safari / Firefox
   without VideoDecoder, or on any decode failure).
     - Same crossfade logic, but loading frame-by-frame over HTTP.

   The canvas pipeline doesn't care which source it's drawing — both
   paths fill an ImageBitmap[] and hand it to `framesRef.current`.
   ========================================================================= */
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createFile, DataStream } from "mp4box";

gsap.registerPlugin(ScrollTrigger);

function frameUrl(base, i, pad) {
  const n = String(i + 1).padStart(pad, "0");
  return `${base}/frame_${n}.webp`;
}

/* Extract the avcC / hvcC box from an MP4Box file as a raw Uint8Array
   suitable for VideoDecoder.configure({ description }). */
function getCodecDescription(file, track) {
  const trak = file.getTrackById(track.id);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) {
      const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8); // skip ISOBMFF header (size+type)
    }
  }
  return undefined;
}

/* PRIMARY: decode a single MP4 into an ImageBitmap[] via WebCodecs +
   MP4Box.js. Each decoded VideoFrame is copied to an ImageBitmap and
   closed right away — VideoDecoder recycles a small pool of GPU frames
   and stalls if outputs are retained. The asset is encoded without
   B-frames, so output arrives in presentation order and `onFrame`
   fires with ascending indices — the canvas can draw mid-decode.
   Returns the (possibly still-filling) bitmap array; throws on any
   setup/decode failure so the caller can fall back to WebP frames. */
async function decodeMp4ToBitmaps(url, onFrame) {
  if (typeof VideoDecoder === "undefined") {
    throw new Error("WebCodecs not available");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("source mp4 fetch failed: " + res.status);
  const buffer = await res.arrayBuffer();
  buffer.fileStart = 0;

  const file = createFile();

  return new Promise((resolve, reject) => {
    let decoder = null;
    let decodeError = null;
    let track = null;
    let bmps = null;
    let samplesFed = 0;
    let outIndex = 0;
    const pendingCopies = [];

    file.onError = (e) => reject(new Error("mp4box: " + e));

    file.onReady = (info) => {
      track = info.videoTracks[0];
      if (!track) return reject(new Error("no video track"));
      bmps = new Array(track.nb_samples);

      decoder = new VideoDecoder({
        output: (frame) => {
          const i = outIndex++;
          pendingCopies.push(
            createImageBitmap(frame)
              .then((bmp) => {
                bmps[i] = bmp;
                if (onFrame) onFrame(i, bmps);
              })
              .catch((e) => {
                decodeError = decodeError || e;
              })
              .finally(() => frame.close())
          );
        },
        error: (e) => {
          decodeError = e;
        },
      });

      const description = getCodecDescription(file, track);
      decoder.configure({
        codec: track.codec,
        codedWidth: track.video.width,
        codedHeight: track.video.height,
        ...(description ? { description } : {}),
        optimizeForLatency: false,
      });

      file.setExtractionOptions(track.id, null, { nbSamples: track.nb_samples });
      file.start();
    };

    file.onSamples = async (id, user, samples) => {
      for (const sample of samples) {
        const ts = (sample.cts * 1e6) / sample.timescale;
        const dur = (sample.duration * 1e6) / sample.timescale;
        const chunk = new EncodedVideoChunk({
          type: sample.is_sync ? "key" : "delta",
          timestamp: ts,
          duration: dur,
          data: sample.data,
        });
        try {
          decoder.decode(chunk);
        } catch (e) {
          decodeError = e;
          break;
        }
      }
      samplesFed += samples.length;
      if (samplesFed < track.nb_samples && !decodeError) return;
      try {
        await decoder.flush();
        await Promise.all(pendingCopies);
        if (decodeError) return reject(decodeError);
        if (!bmps || !bmps[0]) return reject(new Error("decode produced no frames"));
        resolve(bmps);
      } catch (e) {
        reject(e);
      }
    };

    file.appendBuffer(buffer);
    file.flush();
  });
}

/* FALLBACK: preload WebP frame sequence into ImageBitmaps.
   On mobile we load every other frame (384 instead of 768) — the
   difference is invisible on small screens but halves server load.
   Requests are throttled to CONCURRENCY at a time to avoid flooding
   the server when multiple users visit simultaneously. */
async function loadWebpFrames(base, total, onProgress, isMobile) {
  const pad = String(total).length < 4 ? 4 : String(total).length;

  /* Mobile: sample every other frame to halve requests + memory. */
  const indices = [];
  const step = isMobile ? 2 : 1;
  for (let i = 0; i < total; i += step) indices.push(i);

  const bmps = new Array(total);
  const supportsBitmap = typeof createImageBitmap === "function";

  const loadOne = async (i) => {
    try {
      if (supportsBitmap) {
        const r = await fetch(frameUrl(base, i, pad), { cache: "force-cache" });
        if (!r.ok) return;
        const blob = await r.blob();
        bmps[i] = await createImageBitmap(blob);
      } else {
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(base, i, pad);
        await img.decode();
        bmps[i] = img;
      }
      if (onProgress) onProgress(i, bmps);
    } catch (e) {
      /* skip */
    }
  };

  /* Throttle to max CONCURRENCY simultaneous requests to protect server. */
  const CONCURRENCY = isMobile ? 8 : 16;
  const queue = [...indices];

  const worker = async () => {
    while (queue.length) {
      const i = queue.shift();
      await loadOne(i);
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, worker);
  const maxWait = new Promise((r) => setTimeout(r, 10000));

  /* Wait for all frames OR 10s cap — whichever comes first. */
  await Promise.race([Promise.all(workers), maxWait]);

  /* Fill gaps on mobile (missing odd frames) by copying nearest neighbour. */
  if (isMobile) {
    for (let i = 0; i < total; i++) {
      if (!bmps[i] && bmps[i - 1]) bmps[i] = bmps[i - 1];
    }
  }

  return bmps;
}

export default function SiteScrub({
  total: webpTotal,            // count for the webp fallback
  srcBase = "/scrub/desktop",
  srcBaseSm = "/scrub/mobile",
  poster = "/scrub/poster.webp",
  sourceMp4 = "/scrub/source-desktop.mp4",
  sourceMp4Sm = "/scrub/source-mobile.mp4",
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef({ list: [], count: 0, isVideoFrame: false });
  const stateRef = useRef({ frame: 0 });
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  /* Lock scroll + hide nav while loading, unlock when drawer animation starts */
  useEffect(() => {
    const blockWheel = (e) => e.preventDefault();
    const blockTouch = (e) => e.preventDefault();

    if (!isDone) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-loading", "");
      window.addEventListener("wheel", blockWheel, { passive: false });
      window.addEventListener("touchmove", blockTouch, { passive: false });
      /* Hard-reset scroll on anything that sneaks through — browser scroll
         restoration, hash anchors, or programmatic scrolls during loading. */
      const forceTop = () => window.scrollTo(0, 0);
      window.addEventListener("scroll", forceTop, { passive: true });
      return () => {
        window.removeEventListener("wheel", blockWheel);
        window.removeEventListener("touchmove", blockTouch);
        window.removeEventListener("scroll", forceTop);
      };
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-loading");
      window.removeEventListener("wheel", blockWheel);
      window.removeEventListener("touchmove", blockTouch);
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-loading");
      window.removeEventListener("wheel", blockWheel);
      window.removeEventListener("touchmove", blockTouch);
    };
  }, [isDone]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;
    ctx.imageSmoothingQuality = "low";

    const dpr = 1;
    const useMobile = window.innerWidth < 900;

    const fitCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      drawFrame(stateRef.current.frame);
    };

    /* INTER-FRAME CROSSFADE — synthesizes infinite intermediate states
       between any two stored frames by drawing frame N at full alpha,
       then frame N+1 at the fractional alpha on top. Works identically
       for VideoFrame and ImageBitmap sources. */
    const drawFrame = (idx) => {
      const list = framesRef.current.list;
      const count = framesRef.current.count;
      if (count < 1) return;
      const clamped = Math.max(0, Math.min(count - 1, idx));
      const lo = Math.floor(clamped);
      const hi = Math.min(count - 1, lo + 1);
      const f = clamped - lo;
      const a = list[lo];
      if (!a) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = a.codedWidth || a.displayWidth || a.width;
      const ih = a.codedHeight || a.displayHeight || a.height;

      /* The rendered source frames carry thin baked-in black letterbox
         bars (~1% top and bottom of every frame). Left untouched, the
         cover-fit below reveals them as an empty black border along the
         top/bottom edge of the hero on most viewport ratios. We crop them
         off by sampling from an inset source rectangle (drop ~2% top and
         bottom — comfortably past the ~1% bar) so the canvas only ever
         draws clean content. The minuscule zoom this introduces is
         invisible. */
      const bar = Math.round(ih * 0.02);
      const sx = 0;
      const sy = bar;
      const sw = iw;
      const sh = ih - bar * 2;
      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
      ctx.drawImage(a, sx, sy, sw, sh, dx, dy, dw, dh);
      if (f > 0.001 && hi !== lo) {
        const b = list[hi];
        if (b) {
          ctx.globalAlpha = f;
          ctx.drawImage(b, sx, sy, sw, sh, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
        }
      }
    };

    let trigger;
    let ro;
    let cancelled = false;

    const installScrollTrigger = () => {
      ro = new ResizeObserver(fitCanvas);
      ro.observe(wrap);

      /* Hero-scoped: trigger is the nearest <section> ancestor. The
         scrub plays through exactly one viewport of scroll. */
      const section = wrap.closest("section") || document.documentElement;
      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const count = framesRef.current.count;
          stateRef.current.frame = self.progress * (count - 1);
          drawFrame(stateRef.current.frame);
        },
      });
    };

    /* Show the canvas as soon as the first frame exists — the rest of
       the set keeps filling in behind the loading overlay. */
    const onFirstFrame = (bmps) => {
      if (cancelled || framesRef.current.count !== 0) return;
      framesRef.current = { list: bmps, count: bmps.length, isVideoFrame: false };
      fitCanvas();
      drawFrame(0);
      setCanvasReady(true);
    };

    (async () => {
      const minDelay = new Promise((r) => setTimeout(r, 4000));

      let bmps;
      try {
        /* PRIMARY: one MP4 request, hardware-decoded into the same
           96 fps frame set the WebP ladder contained. */
        const mp4 = useMobile ? sourceMp4Sm : sourceMp4;
        bmps = await decodeMp4ToBitmaps(mp4, (i, arr) => {
          if (i === 0) onFirstFrame(arr);
        });
      } catch (e) {
        /* FALLBACK: WebP frame sequence over HTTP. */
        const base = useMobile ? srcBaseSm : srcBase;
        bmps = await loadWebpFrames(base, webpTotal, (i, arr) => {
          if (i === 0) onFirstFrame(arr);
        }, useMobile);
      }

      if (cancelled) {
        bmps.forEach((b) => b && b.close && b.close());
        return;
      }
      framesRef.current = { list: bmps, count: bmps.length, isVideoFrame: false };
      fitCanvas();
      drawFrame(0);
      setCanvasReady(true);
      /* Wait for both frames loaded AND minimum 4s, then start the
         drawer reveal — the overlay slides up and unmounts on
         transition end. */
      await minDelay;
      if (!cancelled) setIsDone(true);

      if (reduce) {
        drawFrame(Math.floor(framesRef.current.count * 0.55));
        return;
      }
      installScrollTrigger();
    })();

    return () => {
      cancelled = true;
      if (trigger) trigger.kill();
      if (ro) ro.disconnect();
      const f = framesRef.current.list;
      f.forEach((x) => {
        if (x && typeof x.close === "function") x.close();
      });
      framesRef.current = { list: [], count: 0, isVideoFrame: false };
    };
  }, [webpTotal, srcBase, srcBaseSm, sourceMp4, sourceMp4Sm]);

  return (
    <>
      {loadingVisible && (
        <div
          className={"site-loading-overlay" + (isDone ? " is-done" : "")}
          aria-hidden="true"
          onTransitionEnd={() => { if (isDone) setLoadingVisible(false); }}
        >
          <img
            src="/velocyn-logo-cream.png"
            alt="Velocyn Solutions"
            className="site-loading-logo"
          />
          <div className="site-loading-mark">
            <span className="site-loading-ring" />
            <span className="site-loading-ring site-loading-ring--2" />
            <span className="site-loading-dot" />
          </div>
        </div>
      )}
      <div ref={wrapRef} className="site-scrub" aria-hidden="true">
        <canvas
          ref={canvasRef}
          className={"site-scrub-canvas" + (canvasReady ? " is-ready" : "")}
          aria-hidden="true"
        />
      </div>
    </>
  );
}

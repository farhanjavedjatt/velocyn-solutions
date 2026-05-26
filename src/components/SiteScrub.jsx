"use client";
/* =========================================================================
   SiteScrub — fixed full-page canvas that scrubs the V animation in
   lockstep with scroll.

   PRIMARY PATH: WebCodecs.
     - Fetches the original source.mp4 (the exact MP4 you've been viewing).
     - MP4Box.js demuxes the H.264 stream into per-frame chunks.
     - The platform's hardware VideoDecoder turns each chunk into a
       GPU-resident VideoFrame.
     - drawImage(videoFrame) is a near-zero-cost GPU blit.
     - Crossfade between adjacent frames synthesizes infinite intermediate
       states for silky slow-scroll smoothness.

   FALLBACK PATH: preloaded WebP frame sequence (older Safari / Firefox).
     - Same crossfade logic, but on ImageBitmaps instead of VideoFrames.

   The canvas pipeline doesn't care which source it's drawing — both
   paths feed `framesRef.current` and `framesRef.count`.
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

/* PRIMARY: decode the entire source MP4 into an in-memory VideoFrame[]
   using WebCodecs + MP4Box.js. Returns { frames, width, height } or
   throws on failure. */
async function decodeMp4ToFrames(url) {
  if (typeof VideoDecoder === "undefined") {
    throw new Error("WebCodecs not available");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("source mp4 fetch failed");
  const buffer = await res.arrayBuffer();
  buffer.fileStart = 0;

  const file = createFile();
  const frames = [];
  let width = 0;
  let height = 0;
  let track = null;

  return new Promise((resolve, reject) => {
    let decoder = null;
    let decodeError = null;

    file.onError = (e) => reject(new Error("mp4box: " + e));

    file.onReady = (info) => {
      track = info.videoTracks[0];
      if (!track) return reject(new Error("no video track"));
      width = track.video.width;
      height = track.video.height;

      decoder = new VideoDecoder({
        output: (frame) => {
          frames.push(frame);
        },
        error: (e) => {
          decodeError = e;
        },
      });

      const description = getCodecDescription(file, track);
      decoder.configure({
        codec: track.codec,
        codedWidth: width,
        codedHeight: height,
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
      try {
        await decoder.flush();
        if (decodeError) return reject(decodeError);
        /* Frames may arrive out of presentation order; sort by timestamp. */
        frames.sort((a, b) => a.timestamp - b.timestamp);
        resolve({ frames, width, height });
      } catch (e) {
        reject(e);
      }
    };

    file.appendBuffer(buffer);
    file.flush();
  });
}

/* FALLBACK: preload WebP frame sequence into ImageBitmaps. */
async function loadWebpFrames(base, total, onProgress, isMobile) {
  const pad = String(total).length < 4 ? 4 : String(total).length;
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
      if (onProgress) onProgress(i);
    } catch (e) {
      /* skip */
    }
  };

  /* Fire all frame requests immediately. Await the first frame quickly
     so the canvas can init, then await everything else so we don't hide
     the loading screen until all 768 frames are truly in memory. */
  const eagerEnd = Math.min(total, isMobile ? 96 : 256);
  const eager = [];
  for (let i = 0; i < eagerEnd; i++) eager.push(loadOne(i));
  await Promise.race([eager[0], new Promise((r) => setTimeout(r, 5000))]);
  const rest = [];
  for (let i = eagerEnd; i < total; i++) rest.push(loadOne(i));
  await Promise.all([...eager, ...rest]);
  return bmps;
}

export default function SiteScrub({
  total: webpTotal,            // count for the webp fallback
  srcBase = "/scrub/desktop",
  srcBaseSm = "/scrub/mobile",
  poster = "/scrub/poster.webp",
  sourceMp4 = "/scrub/source.mp4",
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef({ list: [], count: 0, isVideoFrame: false });
  const stateRef = useRef({ frame: 0 });
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);

  const loadingVideoRef = useRef(null);
  const loadingVideoCallbackRef = (node) => {
    loadingVideoRef.current = node;
    if (!node) return;
    node.loop = true;
    node.play().catch(() => {});
    const restart = () => { node.currentTime = 0; node.play().catch(() => {}); };
    node.addEventListener("ended", restart);
  };

  /* Lock scroll while loading video is shown */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!loadingVisible) {
      document.body.style.overflow = "";
    }
  }, [loadingVisible]);

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
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
      ctx.drawImage(a, dx, dy, dw, dh);
      if (f > 0.001 && hi !== lo) {
        const b = list[hi];
        if (b) {
          ctx.globalAlpha = f;
          ctx.drawImage(b, dx, dy, dw, dh);
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

    (async () => {
      /* PRIMARY: preloaded WebP frame sequence. The WebP ladder has 4×
         the frame count of the WebCodecs path (since we RIFE-interpolate
         offline to 96 fps before encoding). For silky slow-scroll, more
         frames per scroll-pixel matters more than hardware-decoded
         bitmaps. WebCodecs path is kept for future use but disabled
         here while the WebP density is the priority. */
      const base = useMobile ? srcBaseSm : srcBase;
      const minDelay = new Promise((r) => setTimeout(r, 6000));
      const bmps = await loadWebpFrames(base, webpTotal, () => {
        if (cancelled) return;
        /* Init canvas on first frame so it's ready when loading finishes */
        if (framesRef.current.count === 0) {
          framesRef.current = { list: bmps, count: webpTotal, isVideoFrame: false };
          fitCanvas();
          drawFrame(0);
          setCanvasReady(true);
        }
      }, useMobile);
      if (cancelled) {
        bmps.forEach((b) => b && b.close && b.close());
        return;
      }
      framesRef.current = { list: bmps, count: webpTotal, isVideoFrame: false };
      fitCanvas();
      drawFrame(0);
      setCanvasReady(true);
      /* Wait for both frames loaded AND minimum 6s before hiding */
      await minDelay;
      if (!cancelled) setLoadingVisible(false);

      if (reduce) {
        drawFrame(Math.floor(webpTotal * 0.55));
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
  }, [webpTotal, srcBase, srcBaseSm, sourceMp4]);

  return (
    <>
      {loadingVisible && (
        <div className="site-loading-overlay" aria-hidden="true">
          <video
            ref={loadingVideoCallbackRef}
            src="/loading.mp4"
            autoPlay
            muted
            playsInline
            className="site-loading-video"
          />
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

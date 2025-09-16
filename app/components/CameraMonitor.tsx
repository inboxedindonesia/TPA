"use client";
import React, { useEffect, useRef, useState } from "react";

export type CameraStats = {
  faces: number;
  awayEvents: number;
  multiFaceEvents: number;
  absentEvents: number;
  isCameraOn: boolean;
  cameraError: string | null;
  detectorType: "native" | "mediapipe" | "mediapipeLegacy" | "none";
};

type Props = {
  enabled?: boolean; // bật/nonaktifkan kamera dan deteksi
  isInstruction?: boolean; // jika true, deteksi dimatikan tetapi kamera bisa dinyalakan untuk izin
  showPreview?: boolean; // tampilkan preview kecil
  onStatsChange?: (s: CameraStats) => void;
};

export default function CameraMonitor({
  enabled = true,
  isInstruction = false,
  showPreview = true,
  onStatsChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const lastFaceCenterRef = useRef<{ x: number; y: number } | null>(null);
  // Time-based detection windows and cooldowns (ms)
  const AWAY_MIN_DURATION_MS = 1500; // near edge for >= 1.5s
  const AWAY_COOLDOWN_MS = 5000; // at most once every 5s
  const MULTI_MIN_DURATION_MS = 800; // >1 face for >= 0.8s
  const MULTI_COOLDOWN_MS = 5000; // at most once every 5s
  const ABSENT_MIN_DURATION_MS = 1500; // no face for >= 1.5s
  const ABSENT_COOLDOWN_MS = 8000; // at most once every 8s

  // Tracking state for contiguous conditions
  const awayStartAtRef = useRef<number | null>(null);
  const lastAwayEventAtRef = useRef<number>(0);
  const multiStartAtRef = useRef<number | null>(null);
  const lastMultiEventAtRef = useRef<number>(0);
  const absentStartAtRef = useRef<number | null>(null);
  const lastAbsentEventAtRef = useRef<number>(0);
  const cameraStartedRef = useRef(false);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facesCount, setFacesCount] = useState(0);
  const [multiFaceEvents, setMultiFaceEvents] = useState(0);
  const [awayEvents, setAwayEvents] = useState(0);
  const [absentEvents, setAbsentEvents] = useState(0);
  const [detectorType, setDetectorType] = useState<
    "native" | "mediapipe" | "mediapipeLegacy" | "none"
  >("none");

  // Start/stop camera according to enabled
  useEffect(() => {
    if (!enabled) {
      // stop camera
      if (detectionLoopRef.current)
        cancelAnimationFrame(detectionLoopRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      cameraStartedRef.current = false;
      // reset timers and windows
      awayStartAtRef.current = null;
      multiStartAtRef.current = null;
      absentStartAtRef.current = null;
      lastAwayEventAtRef.current = 0;
      lastMultiEventAtRef.current = 0;
      lastAbsentEventAtRef.current = 0;
      setIsCameraOn(false);
      setFacesCount(0);
      setAwayEvents(0);
      setMultiFaceEvents(0);
      setAbsentEvents(0);
      setDetectorType("none");
      return;
    }

    const start = async () => {
      if (cameraStartedRef.current || isCameraOn) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        cameraStartedRef.current = true;
        if (videoRef.current) {
          const v = videoRef.current;
          (v as any).srcObject = stream;
          if (v.readyState < 2) {
            await new Promise<void>((resolve) =>
              v.addEventListener("loadeddata", () => resolve(), { once: true })
            );
          }
          await v.play().catch(() => {});
        }
        setIsCameraOn(true);
        setCameraError(null);
      } catch (err: any) {
        setCameraError(
          err?.name === "NotAllowedError"
            ? "Akses kamera ditolak."
            : "Gagal mengaktifkan kamera."
        );
        setIsCameraOn(false);
      }
    };

    start();
  }, [enabled, isCameraOn]);

  // Reattach stream if video re-renders
  useEffect(() => {
    if (!enabled) return;
    if (isCameraOn && videoRef.current && streamRef.current) {
      const v = videoRef.current;
      (v as any).srcObject = streamRef.current;
      if (v.readyState < 2 || v.videoWidth === 0) {
        v.addEventListener(
          "loadeddata",
          () => {
            v.play().catch(() => {});
          },
          { once: true }
        );
      } else {
        v.play().catch(() => {});
      }
    }
  }, [enabled, isCameraOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionLoopRef.current)
        cancelAnimationFrame(detectionLoopRef.current);
      awayStartAtRef.current = null;
      multiStartAtRef.current = null;
      absentStartAtRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Detection loop
  useEffect(() => {
    if (!enabled || !isCameraOn || isInstruction) return;
    let detector: any = null;
    let type: "native" | "mediapipe" | "mediapipeLegacy" | "none" = "none";
    let running = true;
    let lastLegacyResult: any = null;

    const initDetector = async () => {
      try {
        const FD = (window as any).FaceDetector;
        if (FD) {
          detector = new FD({ fastMode: true, maxDetectedFaces: 3 });
          type = "native";
          setDetectorType("native");
          return;
        }
      } catch {}

      try {
        // Dynamic import from local node_modules (no CDN)
        const vision = await import("@mediapipe/tasks-vision");
        // Use FilesetResolver from local package
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          "/mediapipe/wasm"
        );
        detector = await vision.FaceDetector.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "/mediapipe/wasm/face_detection_short_range.tflite",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          }
        );
        type = "mediapipe";
        setDetectorType("mediapipe");
      } catch (e) {
        detector = null;
        type = "none";
        setDetectorType("none");
        setCameraError(
          "Gagal load vision/mediapipe: " +
            (e instanceof Error ? e.message : String(e))
        );
        console.error("[CameraMonitor] vision/mediapipe import error:", e);
      }

      if (type === "none") {
        try {
          if (!(window as any).__mp_face_detection_loaded) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement("script");
              s.src =
                "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js";
              s.onload = () => resolve();
              s.onerror = () =>
                reject(new Error("failed to load mediapipe legacy"));
              document.head.appendChild(s);
            });
            (window as any).__mp_face_detection_loaded = true;
          }
          const MP: any = (window as any).FaceDetection;
          if (MP && MP.FaceDetection) {
            const mp = new MP.FaceDetection({
              locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`,
            });
            mp.setOptions({ model: "short", minDetectionConfidence: 0.6 });
            mp.onResults((res: any) => {
              lastLegacyResult = res;
            });
            detector = mp;
            type = "mediapipeLegacy";
            setDetectorType("mediapipeLegacy");
          }
        } catch {
          detector = null;
          type = "none";
          setDetectorType("none");
        }
      }
    };

    const tick = async () => {
      if (!running) return;
      const v = videoRef.current as HTMLVideoElement | null;
      if (!v || v.readyState < 2 || (v.videoWidth || 0) === 0) {
        detectionLoopRef.current = requestAnimationFrame(tick);
        return;
      }
      let faces: any[] = [];
      try {
        if (detector && type === "native") {
          faces = await detector.detect(v);
        } else if (detector && type === "mediapipe") {
          const now = performance.now();
          const res = await detector.detectForVideo(v, now);
          const dets = res?.detections || [];
          faces = dets.map((d: any) => {
            const box = d.boundingBox || d.categories?.[0]?.boundingBox;
            if (box) {
              return {
                boundingBox: {
                  x: box.originX ?? box.xMin ?? 0,
                  y: box.originY ?? box.yMin ?? 0,
                  width:
                    box.width ??
                    (box.xMax != null && box.xMin != null
                      ? box.xMax - box.xMin
                      : 0),
                  height:
                    box.height ??
                    (box.yMax != null && box.yMin != null
                      ? box.yMax - box.yMin
                      : 0),
                },
              };
            }
            return {};
          });
        } else if (detector && type === "mediapipeLegacy") {
          try {
            await detector.send({ image: v });
          } catch {}
          const vw = v.videoWidth || 640;
          const vh = v.videoHeight || 480;
          const dets = (lastLegacyResult && lastLegacyResult.detections) || [];
          faces = dets.map((d: any) => {
            const rb =
              d?.relativeBoundingBox ||
              d?.relative_bounding_box ||
              d?.boundingBox ||
              {};
            const norm = (val: number, size: number) =>
              typeof val === "number" && val <= 1 ? val * size : val || 0;
            const x = norm(rb.xMin ?? rb.x ?? rb.originX ?? 0, vw);
            const y = norm(rb.yMin ?? rb.y ?? rb.originY ?? 0, vh);
            const w = norm(
              rb.width ??
                (rb.xMax != null && rb.xMin != null ? rb.xMax - rb.xMin : 0),
              vw
            );
            const h = norm(
              rb.height ??
                (rb.yMax != null && rb.yMin != null ? rb.yMax - rb.yMin : 0),
              vh
            );
            return { boundingBox: { x, y, width: w, height: h } };
          });
        }
      } catch {}

      // Heuristics (time-based) — avoid skyrocketing counters due to FPS
      const nowMs = Date.now();
      if (type === "none") {
        // No detector available; don't count events, just show 0 faces
        setFacesCount(0);
      } else if (!faces || faces.length === 0) {
        setFacesCount(0);
        // Absent condition start/continue
        if (absentStartAtRef.current == null) absentStartAtRef.current = nowMs;
        // reset others
        awayStartAtRef.current = null;
        multiStartAtRef.current = null;
        // Fire event if sustained and not within cooldown
        if (
          nowMs - (absentStartAtRef.current || nowMs) >=
            ABSENT_MIN_DURATION_MS &&
          nowMs - lastAbsentEventAtRef.current >= ABSENT_COOLDOWN_MS
        ) {
          setAbsentEvents((c) => c + 1);
          lastAbsentEventAtRef.current = nowMs;
        }
      } else {
        // Faces present
        setFacesCount(Math.max(0, Number(faces.length) || 0));
        // Reset absent sequence
        absentStartAtRef.current = null;

        // Multi-face detection
        if (faces.length > 1) {
          if (multiStartAtRef.current == null) multiStartAtRef.current = nowMs;
          if (
            nowMs - (multiStartAtRef.current || nowMs) >=
              MULTI_MIN_DURATION_MS &&
            nowMs - lastMultiEventAtRef.current >= MULTI_COOLDOWN_MS
          ) {
            setMultiFaceEvents((c) => c + 1);
            lastMultiEventAtRef.current = nowMs;
          }
        } else {
          multiStartAtRef.current = null;
        }

        // Away detection (face near edges for a sustained duration)
        const face = faces[0];
        const box = face?.boundingBox;
        if (box && v) {
          const vw = v.videoWidth || 640;
          const vh = v.videoHeight || 480;
          const cx = (box.x + box.width / 2) / vw;
          const cy = (box.y + box.height / 2) / vh;
          lastFaceCenterRef.current = { x: cx, y: cy };
          const nearEdge = cx < 0.2 || cx > 0.8 || cy < 0.2 || cy > 0.8;
          if (nearEdge) {
            if (awayStartAtRef.current == null) awayStartAtRef.current = nowMs;
            if (
              nowMs - (awayStartAtRef.current || nowMs) >=
                AWAY_MIN_DURATION_MS &&
              nowMs - lastAwayEventAtRef.current >= AWAY_COOLDOWN_MS
            ) {
              setAwayEvents((c) => c + 1);
              lastAwayEventAtRef.current = nowMs;
            }
          } else {
            awayStartAtRef.current = null;
          }
        } else {
          awayStartAtRef.current = null;
        }
      }

      detectionLoopRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      await initDetector();
      detectionLoopRef.current = requestAnimationFrame(tick);
    })();

    return () => {
      running = false;
      if (detectionLoopRef.current)
        cancelAnimationFrame(detectionLoopRef.current);
    };
  }, [enabled, isCameraOn, isInstruction]);

  // Callback to parent
  useEffect(() => {
    onStatsChange?.({
      faces: facesCount,
      awayEvents,
      multiFaceEvents,
      absentEvents,
      isCameraOn,
      cameraError,
      detectorType,
    });
  }, [
    facesCount,
    awayEvents,
    multiFaceEvents,
    absentEvents,
    isCameraOn,
    cameraError,
    detectorType,
    onStatsChange,
  ]);

  return (
    <>
      {showPreview && (
        <div className="fixed right-3 bottom-3 z-30">
          <div className="relative w-40 h-28 sm:w-48 sm:h-32 rounded-lg overflow-hidden border border-gray-200 shadow bg-black/80">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
              aria-label="Camera preview"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-200">
                {cameraError ? "Kamera tidak aktif" : "Mengaktifkan kamera..."}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  RotateCw,
  SwitchCamera,
  Check,
  AlertCircle,
  Upload,
  RefreshCw,
} from "lucide-react";

interface WatermarkInfo {
  timestamp?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  company?: string | null;
  agent?: string | null;
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  subtitle?: string;
  angleKey?: string;
  watermark?: WatermarkInfo;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDms(value: number, isLatitude: boolean): string {
  const dir = isLatitude ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minutesFloat = (abs - deg) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(4);
  return `${deg}°${minutes}'${seconds}"${dir}`;
}

function formatStamp(raw?: string | null): string {
  const match = raw?.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}:\d{2}:\d{2})/);
  if (match) {
    const [, day, month, year, time] = match;
    return `${day}-${MONTH_NAMES[Number(month) - 1] || month}-${year} ${time}`;
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getDate())}-${MONTH_NAMES[now.getMonth()]}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  info?: WatermarkInfo
) {
  if (!info) return;
  const lines: string[] = [];
  lines.push(formatStamp(info.timestamp));
  if (info.address) lines.push(info.address.toUpperCase());
  if (typeof info.latitude === "number" && typeof info.longitude === "number") {
    lines.push(`${toDms(info.latitude, true)} ${toDms(info.longitude, false)}`);
  }
  const identity = [info.company, info.agent].filter(Boolean).join(" ");
  if (identity) lines.push(identity);

  const fontSize = Math.max(18, Math.round(width * 0.033));
  const lineHeight = Math.round(fontSize * 1.55);
  let y = Math.round(height * 0.52);

  ctx.save();
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
  ctx.strokeStyle = "rgba(0,0,0,0.65)";
  ctx.fillStyle = "#ffffff";

  const maxWidth = width * 0.92;
  for (const line of lines) {
    // Simple wrap for long addresses.
    const words = line.split(" ");
    let current = "";
    const wrapped: string[] = [];
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && current) {
        wrapped.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) wrapped.push(current);
    for (const row of wrapped) {
      ctx.strokeText(row, Math.round(width * 0.04), y);
      ctx.fillText(row, Math.round(width * 0.04), y);
      y += lineHeight;
    }
    y += Math.round(lineHeight * 0.15);
  }
  ctx.restore();
}

const MAX_IMAGE_EDGE = 1920;

async function decodeImage(
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to the <img> decoder below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }
}

async function compositeWatermarkedFile(
  file: File,
  info: WatermarkInfo | undefined,
  angleKey: string
): Promise<File> {
  const { source, width, height } = await decodeImage(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  drawWatermark(ctx, canvas.width, canvas.height, info);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
  if (!blob) throw new Error("Image encoding failed");
  return new File([blob], `photo_${angleKey}_${Date.now()}.jpg`, { type: "image/jpeg" });
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Cargo Photo",
  subtitle,
  angleKey = "cargo",
  watermark,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [flash, setFlash] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Check for camera devices
  useEffect(() => {
    if (!isOpen) return;
    if (
      typeof navigator !== "undefined" &&
      navigator?.mediaDevices?.enumerateDevices
    ) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setCapturedImage(null);
    setCapturedBlob(null);

    stopStream();

    if (
      typeof navigator === "undefined" ||
      !navigator?.mediaDevices ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      setErrorMsg(
        "Direct camera is not supported on the current browser/connection. Please use your device's native camera.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsLoading(false);
    } catch (err: unknown) {
      console.warn("Could not access camera with facingMode:", facingMode, err);
      // Fallback: try any available video stream
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
        setIsLoading(false);
      } catch (fallbackErr: unknown) {
        console.error("Camera access failed:", fallbackErr);
        const error = fallbackErr as { name?: string };
        setErrorMsg(
          error?.name === "NotAllowedError" ||
            error?.name === "PermissionDeniedError"
            ? "Camera access permission was denied. Please allow camera permissions in your browser or use the native camera."
            : "Camera not found or is currently in use by another application.",
        );
        setIsLoading(false);
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedImage(null);
      setCapturedBlob(null);
      setErrorMsg(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Flip camera between front and back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Take snapshot
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;

    const rawWidth = video.videoWidth || 1280;
    const rawHeight = video.videoHeight || 720;
    const captureScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(rawWidth, rawHeight));
    const width = Math.max(1, Math.round(rawWidth * captureScale));
    const height = Math.max(1, Math.round(rawHeight * captureScale));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    // If using user-facing camera, mirror the canvas
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Draw watermark on the final image (mobile-friendly, burned into the JPEG).
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawWatermark(ctx, width, height, watermark);

    // Get data URL for preview
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // Convert to Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      "image/jpeg",
      0.92,
    );

    // Pause video while previewing
    stopStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  // Confirm photo
  const handleConfirmPhoto = () => {
    if (!capturedBlob && !capturedImage) return;

    const timestamp = Date.now();
    const fileName = `photo_${angleKey}_${timestamp}.jpg`;

    if (capturedBlob) {
      const file = new File([capturedBlob], fileName, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    } else if (capturedImage) {
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], fileName, { type: "image/jpeg" });
          onCapture(file);
          onClose();
        })
        .catch(() => {});
    }
  };

  // Native input fallback handler
  const handleNativeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const watermarked = await compositeWatermarkedFile(file, watermark, angleKey);
      onCapture(watermarked);
      onClose();
    } catch {
      // Never upload an unwatermarked photo silently.
      setErrorMsg(
        "This photo could not be processed for watermarking (unsupported format or low memory). Please retake it with the in-app camera or choose a JPEG/PNG file."
      );
    } finally {
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative bg-black flex-1 min-h-[300px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {/* Flash animation */}
          {flash && (
            <div className="absolute inset-0 bg-white z-30 opacity-80 pointer-events-none transition-opacity duration-150" />
          )}

          {/* Captured Preview Mode */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured cargo"
                className="max-h-[60vh] w-auto max-w-full object-contain mx-auto"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                Photo Preview
              </div>
            </div>
          ) : errorMsg ? (
            /* Error & Fallback State */
            <div className="p-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle size={26} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-200">
                  {errorMsg}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You can still take photos directly using your device camera or
                  select a file.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => nativeInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Camera size={16} />
                  <span>Open Device Camera</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700"
                >
                  <RefreshCw size={14} />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <>
              {isLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-white">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-blue-500 mb-2"
                  />
                  <span className="text-xs font-medium text-slate-300">
                    Connecting Camera...
                  </span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[60vh] ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder Target Overlay Guide */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border-2 border-white/30 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                  <div className="bg-slate-950/60 backdrop-blur-xs text-[10px] text-white/90 font-medium px-2 py-0.5 rounded-full border border-white/20">
                    Align camera to cargo
                  </div>
                  <div className="w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>

              {/* Camera Switch Button */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-white/20 shadow-lg transition active:scale-90 cursor-pointer"
                  title="Switch Camera (Front/Rear)"
                >
                  <SwitchCamera size={18} />
                </button>
              )}
            </>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden native input for fallback */}
          <input
            ref={nativeInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleNativeFileChange}
          />
        </div>

        {/* Footer Controls */}
        <div className="px-4 py-3.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Controls after snapping */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RotateCw size={14} />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
              >
                <Check size={16} />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            /* Controls while live stream is active */
            <>
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
                title="Open device native camera"
              >
                <Upload size={13} />
                <span>Device Camera</span>
              </button>

              {/* Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={isLoading || Boolean(errorMsg)}
                  className={`w-14 h-14 rounded-full border-4 border-white/90 bg-blue-600 hover:bg-blue-500 active:scale-90 flex items-center justify-center text-white shadow-xl transition-all cursor-pointer ${
                    isLoading || Boolean(errorMsg)
                      ? "opacity-40 pointer-events-none"
                      : ""
                  }`}
                  aria-label="Take Photo"
                  title="Take Photo"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

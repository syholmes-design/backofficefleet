"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type Props = {
  onChange: (pngDataUrl: string) => void;
};

export function RecipientSignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const moved = useRef(0);
  const [blank, setBlank] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#0f172a";
    context.lineWidth = 2;
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function publish() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || moved.current < 8) {
      setBlank(true);
      onChange("");
      return;
    }
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const alpha = pixels[index + 3] ?? 0;
      const white = (pixels[index] ?? 255) >= 250 && (pixels[index + 1] ?? 255) >= 250 && (pixels[index + 2] ?? 255) >= 250;
      if (alpha >= 20 && !white) ink += 1;
    }
    if (ink < 8) {
      setBlank(true);
      onChange("");
      return;
    }
    setBlank(false);
    onChange(canvas.toDataURL("image/png"));
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={640}
        height={180}
        className="w-full touch-none rounded border border-slate-600 bg-white"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!context) return;
          drawing.current = true;
          moved.current = 0;
          canvas?.setPointerCapture(event.pointerId);
          const next = point(event);
          context.beginPath();
          context.moveTo(next.x, next.y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = canvasRef.current?.getContext("2d");
          if (!context) return;
          const next = point(event);
          context.lineTo(next.x, next.y);
          context.stroke();
          moved.current += 1;
        }}
        onPointerUp={() => {
          drawing.current = false;
          publish();
        }}
      />
      {blank ? <p className="mt-1 text-[11px] text-amber-300">Draw the signature. A blank canvas is not accepted.</p> : null}
      <p className="mt-1 text-[11px] text-slate-400">Sign with a finger or pointer. A connection to BOF is required. Offline signing is not available.</p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Copy, Twitter } from "lucide-react";
import { toast } from "sonner";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface DrawingReplayProps {
  points: Point[];
  canvasWidth: number;
  canvasHeight: number;
  name: string;
  twitterHandle?: string;
  shareUrl: string;
}

export function DrawingReplay({
  points,
  canvasWidth,
  canvasHeight,
  name,
  twitterHandle,
  shareUrl,
}: DrawingReplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Setup canvas and draw the complete drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Set background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Configure drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw all points at once
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
    }
  }, [points, canvasWidth, canvasHeight]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleTwitterShare = () => {
    const text = `Check out my Etch-A-Sketch drawing: ${name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">{name}</h1>
        {twitterHandle && (
          <p className="text-sm text-white/80">
            by {twitterHandle}
          </p>
        )}
      </div>

      {/* Canvas */}
      <div className="shrink-0 w-full md:w-auto flex justify-center mb-8">
        <div className="w-full max-w-full md:max-w-none bg-gray-200 dark:bg-gray-300 p-2 rounded-lg border-4 border-red-800">
          <canvas
            ref={canvasRef}
            className="rounded w-full h-auto"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-4 items-center">
        <Button onClick={handleCopy} variant="outline" className="gap-2 bg-white hover:bg-gray-100">
          {copied ? (
            <>
              <Copy className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </Button>
        <Button onClick={handleTwitterShare} variant="outline" className="gap-2 bg-white hover:bg-gray-100">
          <Twitter className="w-4 h-4" />
          Share on Twitter
        </Button>
      </div>
    </div>
  );
}


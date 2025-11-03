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
    <div className="flex flex-col items-center gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        {twitterHandle && (
          <p className="text-sm text-muted-foreground">
            by {twitterHandle}
          </p>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-shrink-0 w-full flex justify-center px-4">
        <div className="w-full max-w-2xl">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-gray-400 dark:border-gray-600 touch-none w-full h-auto"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-4 items-center">
        <Button onClick={handleCopy} variant="outline" className="gap-2">
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
        <Button onClick={handleTwitterShare} variant="outline" className="gap-2">
          <Twitter className="w-4 h-4" />
          Share on Twitter
        </Button>
      </div>
    </div>
  );
}


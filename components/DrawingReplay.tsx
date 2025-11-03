"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Play, Pause, Copy, Twitter } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(0);
  const [copied, setCopied] = useState(false);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [canvasWidth, canvasHeight]);

  // Reset canvas
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    currentIndexRef.current = 0;
    setProgress(0);
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Play animation
  const play = () => {
    if (points.length === 0) return;

    setIsPlaying(true);
    const startIndex = currentIndexRef.current;
    
    // Calculate start time based on current progress
    const startTimestamp = startIndex > 0 
      ? points[startIndex - 1].timestamp 
      : points[0].timestamp;
    
    startTimeRef.current = performance.now() - (startTimestamp - points[0].timestamp) * 0.5;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const currentTime = points[0].timestamp + elapsed * 2; // 2x speed

      const canvas = canvasRef.current;
      if (!canvas) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      // Find the next point to draw
      let nextIndex = currentIndexRef.current;
      while (
        nextIndex < points.length &&
        points[nextIndex].timestamp <= currentTime
      ) {
        nextIndex++;
      }

      // Draw up to nextIndex
      if (nextIndex > currentIndexRef.current) {
        ctx.beginPath();
        ctx.moveTo(
          points[currentIndexRef.current].x,
          points[currentIndexRef.current].y
        );

        for (let i = currentIndexRef.current + 1; i < nextIndex; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
        currentIndexRef.current = nextIndex;
        setProgress((nextIndex / points.length) * 100);
      }

      // Check if finished
      if (nextIndex >= points.length) {
        setIsPlaying(false);
        setProgress(100);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Pause animation
  const pause = () => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

      {/* Controls */}
      <div className="flex flex-col gap-4 items-center w-full">
        <div className="flex gap-4 items-center">
          <Button onClick={togglePlay} variant="outline" className="gap-2">
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </Button>
          <Button onClick={resetCanvas} variant="outline">
            Reset
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
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
    </div>
  );
}


"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface DrawingCanvasRef {
  erase: () => void;
  getPoints: () => Point[];
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  xValue: number;
  yValue: number;
  onPointAdd?: (point: Point) => void;
  className?: string;
}

export const DrawingCanvas = React.forwardRef<
  DrawingCanvasRef,
  DrawingCanvasProps
>(({ width, height, xValue, yValue, onPointAdd, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Convert normalized values (0-1) to canvas coordinates
  const canvasX = xValue * width;
  const canvasY = yValue * height;

  // Draw the current path
  const drawPath = (ctx: CanvasRenderingContext2D, path: Point[]) => {
    if (path.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  };

  // Redraw canvas
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#e5e7eb"; // Light gray background
    ctx.fillRect(0, 0, width, height);

    // Draw all points
    drawPath(ctx, currentPath);

    // Draw current line if drawing
    if (isDrawing && lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }
  };

  // Setup canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Configure drawing style
    ctx.strokeStyle = "#000000"; // Black line
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Set background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, width, height);

    // Draw existing path
    drawPath(ctx, currentPath);
  }, [width, height]);

  // Handle drawing updates
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCapture = now - lastCaptureTimeRef.current;

    // Check if we should start drawing (cursor moved)
    if (lastPointRef.current) {
      const dx = canvasX - lastPointRef.current.x;
      const dy = canvasY - lastPointRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.5) {
        // Small threshold to avoid noise
        setIsDrawing(true);
      }
    } else {
      setIsDrawing(true);
    }

    // Capture point at 60fps (every ~16ms)
    if (timeSinceLastCapture >= 16) {
      const point: Point = {
        x: canvasX,
        y: canvasY,
        timestamp: now,
      };

      // Add point to path
      setCurrentPath((prev) => {
        const newPath = [...prev, point];
        return newPath;
      });

      // Notify parent
      onPointAdd?.(point);

      lastPointRef.current = point;
      lastCaptureTimeRef.current = now;
    }

    // Redraw on animation frame
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        redraw();
        animationFrameRef.current = null;
      });
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [canvasX, canvasY, width, height, onPointAdd]);

  // Redraw when path changes
  useEffect(() => {
    redraw();
  }, [currentPath]);

  // Erase function
  const erase = () => {
    setCurrentPath([]);
    lastPointRef.current = null;
    setIsDrawing(false);
    redraw();
  };

  // Expose methods via ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref({ erase, getPoints: () => currentPath });
      } else {
        ref.current = { erase, getPoints: () => currentPath };
      }
    }
  }, [ref, currentPath]);

  return (
    <canvas
      ref={canvasRef}
      className={`touch-none ${className || ""}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
});

DrawingCanvas.displayName = "DrawingCanvas";


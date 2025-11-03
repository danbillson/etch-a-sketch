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
  injectPoints: (points: Point[]) => void;
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
  const xValueRef = useRef(xValue);
  const yValueRef = useRef(yValue);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const currentPathRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    xValueRef.current = xValue;
    yValueRef.current = yValue;
    widthRef.current = width;
    heightRef.current = height;
  }, [xValue, yValue, width, height]);

  // Update state refs
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

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

    // Get current values from refs
    const currentWidth = widthRef.current;
    const currentHeight = heightRef.current;
    const currentX = xValueRef.current * currentWidth;
    const currentY = yValueRef.current * currentHeight;

    // Clear canvas
    ctx.fillStyle = "#e5e7eb"; // Light gray background
    ctx.fillRect(0, 0, currentWidth, currentHeight);

    // Draw all points from ref
    drawPath(ctx, currentPathRef.current);

    // Draw current line if drawing (from ref) - but stop just before cursor
    if (isDrawingRef.current && lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      // Draw line to cursor position
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    }

    // Draw red cursor indicator (single pixel) - always visible, drawn last
    // Draw after all strokes to ensure it's on top
    // Use putImageData for precise single pixel rendering
    const imageData = ctx.createImageData(1, 1);
    const data = imageData.data;
    data[0] = 239; // R
    data[1] = 68;  // G
    data[2] = 68;  // B
    data[3] = 255; // A
    ctx.putImageData(imageData, Math.floor(currentX), Math.floor(currentY));
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
    
    // Draw initial cursor position
    const initialX = xValue * width;
    const initialY = yValue * height;
    const imageData = ctx.createImageData(1, 1);
    const data = imageData.data;
    data[0] = 239; // R
    data[1] = 68;  // G
    data[2] = 68;  // B
    data[3] = 255; // A
    ctx.putImageData(imageData, Math.floor(initialX), Math.floor(initialY));
  }, [width, height, xValue, yValue]);

  // Handle drawing updates with smooth continuous drawing
  useEffect(() => {
    // Use requestAnimationFrame for smooth updates
    const animate = () => {
      const now = Date.now();
      const timeSinceLastCapture = now - lastCaptureTimeRef.current;
      
      // Get current values from refs to avoid stale closures
      const currentX = xValueRef.current * widthRef.current;
      const currentY = yValueRef.current * heightRef.current;

      // Check if we should start drawing (cursor moved)
      if (lastPointRef.current) {
        const dx = currentX - lastPointRef.current.x;
        const dy = currentY - lastPointRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
          // Reduced threshold for smoother drawing
          setIsDrawing(true);
          isDrawingRef.current = true;
        }
      } else {
        setIsDrawing(true);
        isDrawingRef.current = true;
      }

      // Capture point more frequently for smoother lines (every ~8ms for ~120fps equivalent)
      if (timeSinceLastCapture >= 8) {
        const point: Point = {
          x: currentX,
          y: currentY,
          timestamp: now,
        };

        // Add point to path
        setCurrentPath((prev) => {
          const newPath = [...prev, point];
          currentPathRef.current = newPath; // Update ref immediately
          return newPath;
        });

        // Notify parent
        onPointAdd?.(point);

        lastPointRef.current = point;
        lastCaptureTimeRef.current = now;
      }

      // Always redraw for smooth visual updates
      redraw();

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop if not already running
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [onPointAdd]); // Only depend on onPointAdd, values come from refs

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

  // Inject points programmatically (for AI-generated paths)
  const injectPoints = (points: Point[]) => {
    if (points.length === 0) return;
    
    setCurrentPath((prev) => {
      const newPath = [...prev, ...points];
      currentPathRef.current = newPath;
      return newPath;
    });
    
    // Update last point
    if (points.length > 0) {
      lastPointRef.current = points[points.length - 1];
    }
    
    // Update drawing state
    setIsDrawing(true);
    isDrawingRef.current = true;
    
    // Trigger redraw
    redraw();
  };

  // Expose methods via ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref({ erase, getPoints: () => currentPath, injectPoints });
      } else {
        ref.current = { erase, getPoints: () => currentPath, injectPoints };
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


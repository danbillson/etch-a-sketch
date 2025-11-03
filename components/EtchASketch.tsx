"use client";

import { useEffect, useRef, useState } from "react";
import { DrawingKnob } from "./DrawingKnob";
import { DrawingCanvas, DrawingCanvasRef } from "./DrawingCanvas";
import { Button } from "./ui/button";
import { SaveDialog } from "./SaveDialog";
import { Trash2 } from "lucide-react";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface EtchASketchProps {
  onSave?: () => void;
}

export function EtchASketch({ onSave }: EtchASketchProps) {
  const [xValue, setXValue] = useState(0.5);
  const [yValue, setYValue] = useState(0.5);
  const [points, setPoints] = useState<Point[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 80, 400);
        const aspectRatio = 600 / 400;
        setCanvasSize({
          width: maxWidth,
          height: maxWidth / aspectRatio,
        });
      } else {
        setCanvasSize({ width: 600, height: 400 });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;

  const handlePointAdd = (point: Point) => {
    setPoints((prev) => [...prev, point]);
  };

  const handleErase = () => {
    canvasRef.current?.erase();
    setPoints([]);
  };

  const handleShake = () => {
    // Add shake animation effect
    const container = document.getElementById("etch-container");
    if (container) {
      container.style.animation = "shake 0.5s";
      setTimeout(() => {
        if (container) {
          container.style.animation = "";
        }
      }, 500);
    }
    handleErase();
  };

  // Set up device motion listener
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      const handleDeviceMotion = (e: DeviceMotionEvent) => {
        const acceleration = e.accelerationIncludingGravity;
        if (!acceleration) return;

        const threshold = 15; // Adjust sensitivity
        const totalAcceleration =
          Math.abs(acceleration.x || 0) +
          Math.abs(acceleration.y || 0) +
          Math.abs(acceleration.z || 0);

        if (totalAcceleration > threshold) {
          handleShake();
        }
      };

      window.addEventListener("devicemotion", handleDeviceMotion as any);
      return () => {
        window.removeEventListener("devicemotion", handleDeviceMotion as any);
      };
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Etch-A-Sketch</h1>
        <p className="text-sm text-muted-foreground">
          Use A/S for horizontal, K/L for vertical controls
        </p>
      </div>

      {/* Main drawing area */}
      <div
        id="etch-container"
        className="flex flex-col md:flex-row items-center gap-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-4 border-gray-300 dark:border-gray-700 transition-all"
      >
        {/* Left knob */}
        <DrawingKnob
          value={xValue}
          onChange={setXValue}
          label="Horizontal"
          keyboardKeys={{ increment: "s", decrement: "a" }}
        />

        {/* Canvas */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
          <div className="w-full max-w-full md:max-w-none">
            <DrawingCanvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              xValue={xValue}
              yValue={yValue}
              onPointAdd={handlePointAdd}
              className="rounded-lg border-2 border-gray-400 dark:border-gray-600 w-full h-auto"
            />
          </div>
        </div>

        {/* Right knob */}
        <DrawingKnob
          value={yValue}
          onChange={setYValue}
          label="Vertical"
          keyboardKeys={{ increment: "l", decrement: "k" }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <Button
          onClick={handleShake}
          variant="outline"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Shake to Erase
        </Button>
        <Button onClick={() => setSaveDialogOpen(true)} disabled={points.length === 0}>
          Save & Share
        </Button>
      </div>

      {/* Save Dialog */}
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        points={points}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
      />

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-10px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}


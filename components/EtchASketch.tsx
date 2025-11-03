"use client";

import { useEffect, useRef, useState } from "react";
import { DrawingKnob } from "./DrawingKnob";
import { DrawingCanvas, DrawingCanvasRef } from "./DrawingCanvas";
import { SaveDialog } from "./SaveDialog";
import { HelpDrawer, HelpButton } from "./HelpDrawer";
import { ImageUploadDialog } from "./ImageUploadDialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export function EtchASketch() {
  const router = useRouter();
  const [xValue, setXValue] = useState(0.5);
  const [yValue, setYValue] = useState(0.5);
  const [points, setPoints] = useState<Point[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 120, 400);
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

  const handleImageProcessed = (newPoints: Point[]) => {
    // Inject points into canvas
    canvasRef.current?.injectPoints(newPoints);
    // Also update points state for saving
    setPoints((prev) => [...prev, ...newPoints]);
  };

  const handleErase = () => {
    canvasRef.current?.erase();
    setPoints([]);
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
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when dialogs are open
      if (saveDialogOpen || helpOpen || imageUploadOpen) {
        return;
      }

      // Prevent default for our shortcuts
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleErase();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (points.length > 0) {
          setSaveDialogOpen(true);
        }
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        router.push("/gallery");
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [points.length, router, saveDialogOpen, helpOpen, imageUploadOpen]);

  // Set up device motion listener for shake
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      const handleDeviceMotion = (e: DeviceMotionEvent) => {
        const acceleration = e.accelerationIncludingGravity;
        if (!acceleration) return;

        const threshold = 15;
        const totalAcceleration =
          Math.abs(acceleration.x || 0) +
          Math.abs(acceleration.y || 0) +
          Math.abs(acceleration.z || 0);

        if (totalAcceleration > threshold) {
          handleErase();
        }
      };

      window.addEventListener("devicemotion", handleDeviceMotion);
      return () => {
        window.removeEventListener("devicemotion", handleDeviceMotion);
      };
    }
  }, []);

  return (
    <>
      <HelpButton onClick={() => setHelpOpen(true)} />
      
      {/* Upload Image Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setImageUploadOpen(true)}
          variant="outline"
          size="icon"
          className="shadow-lg"
          disabled={saveDialogOpen || helpOpen || imageUploadOpen}
        >
          <Upload className="w-4 h-4" />
          <span className="sr-only">Upload Image</span>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        {/* Container for frame and knobs */}
        <div className="relative flex flex-col items-center">
          {/* Main drawing area - styled like classic Etch-A-Sketch */}

          {/* Canvas */}
          <div className="shrink-0 w-full md:w-auto flex justify-center">
            <div className="w-full max-w-full md:max-w-none bg-gray-200 dark:bg-gray-300 p-2 rounded-lg border-4 border-red-800">
              <DrawingCanvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                xValue={xValue}
                yValue={yValue}
                onPointAdd={handlePointAdd}
                className="rounded w-full h-auto"
              />
            </div>
          </div>

          {/* Knobs below the frame, positioned at left and right edges */}
          <div
            className="relative flex flex-row justify-between items-start mt-6 w-full"
            style={{ width: `${CANVAS_WIDTH + 112}px`, maxWidth: "100%" }}
          >
            <div className="shrink-0">
              <DrawingKnob
                value={xValue}
                onChange={setXValue}
                keyboardKeys={{ increment: "s", decrement: "a" }}
                disabled={saveDialogOpen || helpOpen}
              />
            </div>
            <div className="shrink-0">
              <DrawingKnob
                value={yValue}
                onChange={setYValue}
                keyboardKeys={{ increment: "l", decrement: "k" }}
                disabled={saveDialogOpen || helpOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        points={points}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
      />

      {/* Help Drawer */}
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageUploadOpen}
        onOpenChange={setImageUploadOpen}
        onImageProcessed={handleImageProcessed}
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
    </>
  );
}

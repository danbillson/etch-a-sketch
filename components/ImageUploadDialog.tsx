"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageProcessed: (points: Array<{ x: number; y: number; timestamp: number }>) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onImageProcessed,
  canvasWidth,
  canvasHeight,
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("canvasWidth", canvasWidth.toString());
      formData.append("canvasHeight", canvasHeight.toString());

      setProgress(20);

      // Call API to analyze image
      const response = await fetch("/api/draw-from-image", {
        method: "POST",
        body: formData,
      });

      setProgress(50);

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || error.details || "Failed to process image");
        } else {
          // Response is HTML (error page)
          const text = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      setProgress(70);

      // Process image on client side to generate drawing path
      const points = await generateDrawingPath(data.imageData, canvasWidth, canvasHeight);
      
      setProgress(100);
      
      // Call callback with generated points
      onImageProcessed(points);
      
      toast.success("Image processed successfully!");
      
      // Reset and close
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setProgress(0);
        setIsProcessing(false);
        onOpenChange(false);
      }, 500);
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process image");
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const generateDrawingPath = async (
    imageDataUrl: string,
    width: number,
    height: number
  ): Promise<Array<{ x: number; y: number; timestamp: number }>> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for processing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve([]);
          return;
        }

        // Scale image to fit canvas while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          // Image is wider
          drawHeight = width / imgAspect;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Image is taller
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.fillStyle = "#e5e7eb"; // Background color
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convert to grayscale and find edges
        const edges: Array<{ x: number; y: number }> = [];
        
        // Simple Sobel-like edge detection
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const gray = (r + g + b) / 3;
            
            // Get neighbors
            const idxTop = ((y - 1) * width + x) * 4;
            const idxBottom = ((y + 1) * width + x) * 4;
            const idxLeft = (y * width + (x - 1)) * 4;
            const idxRight = (y * width + (x + 1)) * 4;
            
            const grayTop = (data[idxTop] + data[idxTop + 1] + data[idxTop + 2]) / 3;
            const grayBottom = (data[idxBottom] + data[idxBottom + 1] + data[idxBottom + 2]) / 3;
            const grayLeft = (data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2]) / 3;
            const grayRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
            
            // Calculate gradient
            const gradientX = Math.abs(grayRight - grayLeft);
            const gradientY = Math.abs(grayBottom - grayTop);
            const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
            
            // Threshold for edge detection (adjustable)
            if (gradient > 30) {
              edges.push({ x, y });
            }
          }
        }

        if (edges.length === 0) {
          resolve([]);
          return;
        }

        // Create continuous path using nearest neighbor approach
        const points: Array<{ x: number; y: number; timestamp: number }> = [];
        let currentPoint = edges[0];
        const remainingEdges = [...edges.slice(1)];
        const startTime = Date.now();

        // Add first point
        points.push({
          x: currentPoint.x,
          y: currentPoint.y,
          timestamp: startTime,
        });

        // Build path by connecting nearest points
        while (remainingEdges.length > 0 && points.length < 5000) {
          let nearestIdx = 0;
          let nearestDist = Infinity;

          for (let i = 0; i < remainingEdges.length; i++) {
            const edge = remainingEdges[i];
            const dx = edge.x - currentPoint.x;
            const dy = edge.y - currentPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = i;
            }
          }

          // If nearest point is too far, start a new path segment
          if (nearestDist > 50) {
            if (remainingEdges.length > 0) {
              currentPoint = remainingEdges[0];
              remainingEdges.splice(0, 1);
            } else {
              break;
            }
          } else {
            currentPoint = remainingEdges[nearestIdx];
            remainingEdges.splice(nearestIdx, 1);
          }

          // Add point with timestamp spacing
          points.push({
            x: currentPoint.x,
            y: currentPoint.y,
            timestamp: startTime + points.length * 8, // ~8ms between points
          });
        }

        resolve(points);
      };
      img.src = imageDataUrl;
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image to Draw</DialogTitle>
          <DialogDescription>
            Upload an image and AI will convert it into an etch-a-sketch drawing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <ImageIcon className="w-12 h-12 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select an image
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-700"
                />
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                    Processing image... {progress}%
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Process & Draw
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


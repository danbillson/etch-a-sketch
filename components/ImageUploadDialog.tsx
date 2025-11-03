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

        // Step 1: Convert to grayscale array for efficient processing
        const grayData = new Uint8Array(width * height);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            grayData[y * width + x] = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          }
        }

        // Step 2: Calculate gradients using proper Sobel operator
        const gradients: Array<{ x: number; y: number; magnitude: number; direction: number }> = [];
        const MAX_POINTS = 7500;
        const gridSize = 12; // Increase grid size for better filtering
        
        // Use Sobel operator for better edge detection
        for (let y = 2; y < height - 2; y++) {
          for (let x = 2; x < width - 2; x++) {
            // Sobel X kernel
            const sobelX = 
              -grayData[(y - 1) * width + (x - 1)] - 2 * grayData[y * width + (x - 1)] - grayData[(y + 1) * width + (x - 1)] +
              grayData[(y - 1) * width + (x + 1)] + 2 * grayData[y * width + (x + 1)] + grayData[(y + 1) * width + (x + 1)];
            
            // Sobel Y kernel
            const sobelY = 
              -grayData[(y - 1) * width + (x - 1)] - 2 * grayData[(y - 1) * width + x] - grayData[(y - 1) * width + (x + 1)] +
              grayData[(y + 1) * width + (x - 1)] + 2 * grayData[(y + 1) * width + x] + grayData[(y + 1) * width + (x + 1)];
            
            const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
            const direction = Math.atan2(sobelY, sobelX);
            
            gradients.push({ x, y, magnitude, direction });
          }
        }

        if (gradients.length === 0) {
          resolve([]);
          return;
        }

        // Step 3: Non-maximum suppression for edge thinning
        const suppressed: Array<{ x: number; y: number; magnitude: number }> = [];
        const gradientMap = new Map<string, { x: number; y: number; magnitude: number; direction: number }>();
        
        for (const g of gradients) {
          const key = `${g.x},${g.y}`;
          gradientMap.set(key, g);
        }
        
        for (const g of gradients) {
          const dir = g.direction;
          const mag = g.magnitude;
          
          // Determine neighbors based on edge direction
          let n1: { x: number; y: number } | null = null;
          let n2: { x: number; y: number } | null = null;
          
          // Quantize direction to 4 directions (0°, 45°, 90°, 135°)
          const angle = Math.abs(dir);
          if (angle < Math.PI / 8 || angle > 7 * Math.PI / 8) {
            // Horizontal
            n1 = { x: g.x - 1, y: g.y };
            n2 = { x: g.x + 1, y: g.y };
          } else if (angle > Math.PI / 8 && angle < 3 * Math.PI / 8) {
            // Diagonal 45°
            n1 = { x: g.x - 1, y: g.y - 1 };
            n2 = { x: g.x + 1, y: g.y + 1 };
          } else if (angle > 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
            // Vertical
            n1 = { x: g.x, y: g.y - 1 };
            n2 = { x: g.x, y: g.y + 1 };
          } else {
            // Diagonal 135°
            n1 = { x: g.x + 1, y: g.y - 1 };
            n2 = { x: g.x - 1, y: g.y + 1 };
          }
          
          // Check if this is a local maximum
          const mag1 = gradientMap.get(`${n1.x},${n1.y}`)?.magnitude || 0;
          const mag2 = gradientMap.get(`${n2.x},${n2.y}`)?.magnitude || 0;
          
          if (mag >= mag1 && mag >= mag2) {
            suppressed.push({ x: g.x, y: g.y, magnitude: mag });
          }
        }

        // Step 4: Calculate complexity metrics and adaptive thresholds
        const magnitudes = suppressed.map(e => e.magnitude);
        const sortedMagnitudes = [...magnitudes].sort((a, b) => b - a);
        const medianMagnitude = sortedMagnitudes[Math.floor(sortedMagnitudes.length / 2)];
        const top5PercentMagnitude = sortedMagnitudes[Math.floor(sortedMagnitudes.length * 0.05)];
        const top10PercentMagnitude = sortedMagnitudes[Math.floor(sortedMagnitudes.length * 0.10)];
        
        // Use hysteresis thresholding (high and low thresholds)
        const highThreshold = Math.max(80, top5PercentMagnitude * 0.8);
        const lowThreshold = Math.max(40, highThreshold * 0.4);
        
        // Step 5: Hysteresis thresholding to filter weak edges
        const strongEdges: Array<{ x: number; y: number; magnitude: number }> = [];
        const weakEdges: Array<{ x: number; y: number; magnitude: number }> = [];
        
        for (const edge of suppressed) {
          if (edge.magnitude >= highThreshold) {
            strongEdges.push(edge);
          } else if (edge.magnitude >= lowThreshold) {
            weakEdges.push(edge);
          }
        }
        
        // Connect weak edges to strong edges (only keep weak edges that are adjacent to strong edges)
        const edgeMap = new Set<string>();
        for (const edge of strongEdges) {
          edgeMap.add(`${edge.x},${edge.y}`);
        }
        
        // Keep weak edges that are adjacent to strong edges
        const connectedWeakEdges: Array<{ x: number; y: number; magnitude: number }> = [];
        for (const edge of weakEdges) {
          // Check 8 neighbors
          const neighbors = [
            { x: edge.x - 1, y: edge.y - 1 },
            { x: edge.x, y: edge.y - 1 },
            { x: edge.x + 1, y: edge.y - 1 },
            { x: edge.x - 1, y: edge.y },
            { x: edge.x + 1, y: edge.y },
            { x: edge.x - 1, y: edge.y + 1 },
            { x: edge.x, y: edge.y + 1 },
            { x: edge.x + 1, y: edge.y + 1 },
          ];
          
          const hasStrongNeighbor = neighbors.some(n => edgeMap.has(`${n.x},${n.y}`));
          if (hasStrongNeighbor) {
            connectedWeakEdges.push(edge);
          }
        }
        
        // Combine strong and connected weak edges
        const edges = [...strongEdges, ...connectedWeakEdges];

        if (edges.length === 0) {
          resolve([]);
          return;
        }

        // Step 6: Spatial sampling with adaptive density
        let finalEdges: Array<{ x: number; y: number }> = [];
        const targetEdgeCount = MAX_POINTS * 1.2; // Reduced from 1.5x
        
        if (edges.length > targetEdgeCount) {
          // Use spatial grid sampling to ensure even coverage
          const gridCols = Math.ceil(width / gridSize);
          const gridRows = Math.ceil(height / gridSize);
          const grid: Array<Array<Array<{ x: number; y: number; magnitude: number }>>> = 
            Array(gridRows).fill(null).map(() => Array(gridCols).fill(null).map(() => []));
          
          // Group edges by grid cell
          for (const edge of edges) {
            const gridX = Math.floor(edge.x / gridSize);
            const gridY = Math.floor(edge.y / gridSize);
            if (gridY >= 0 && gridY < gridRows && gridX >= 0 && gridX < gridCols) {
              grid[gridY][gridX].push(edge);
            }
          }
          
          // Calculate edges per cell with adaptive sampling
          const edgesPerCell = Math.ceil(targetEdgeCount / (gridRows * gridCols));
          
          for (let gy = 0; gy < gridRows; gy++) {
            for (let gx = 0; gx < gridCols; gx++) {
              const cellEdges = grid[gy][gx];
              if (cellEdges.length === 0) continue;
              
              // Sort by magnitude and take strongest edges
              cellEdges.sort((a, b) => b.magnitude - a.magnitude);
              
              // Take fewer edges per cell to reduce noise
              const sampled = cellEdges.slice(0, Math.min(edgesPerCell, Math.max(1, Math.floor(cellEdges.length * 0.3))));
              
              // Add sampled edges
              for (const edge of sampled) {
                finalEdges.push({ x: edge.x, y: edge.y });
              }
            }
          }
        } else {
          // Not too many edges, use all of them
          finalEdges = edges.map(e => ({ x: e.x, y: e.y }));
        }

        // Step 7: Create continuous path using nearest neighbor approach
        const points: Array<{ x: number; y: number; timestamp: number }> = [];
        let currentPoint = finalEdges[0];
        const remainingEdges = [...finalEdges.slice(1)];
        const startTime = Date.now();

        // Add first point
        points.push({
          x: currentPoint.x,
          y: currentPoint.y,
          timestamp: startTime,
        });

        // Build path by connecting nearest points
        // Limit to 7500 points to leave room for additional manual drawing before hitting Convex limit (8192)
        while (remainingEdges.length > 0 && points.length < MAX_POINTS) {
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


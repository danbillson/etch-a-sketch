"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface Drawing {
  _id: string;
  _creationTime: number;
  name: string;
  twitterHandle?: string;
  points: Point[];
  canvasWidth: number;
  canvasHeight: number;
}

interface DrawingCardProps {
  drawing: Drawing;
}

export function DrawingCard({ drawing }: DrawingCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw thumbnail preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || drawing.points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for thumbnail
    const thumbnailSize = 200;
    canvas.width = thumbnailSize;
    canvas.height = (drawing.canvasHeight / drawing.canvasWidth) * thumbnailSize;

    // Scale points to thumbnail size
    const scaleX = canvas.width / drawing.canvasWidth;
    const scaleY = canvas.height / drawing.canvasHeight;

    // Draw background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all points
    if (drawing.points.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(
        drawing.points[0].x * scaleX,
        drawing.points[0].y * scaleY
      );

      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(
          drawing.points[i].x * scaleX,
          drawing.points[i].y * scaleY
        );
      }

      ctx.stroke();
    }
  }, [drawing]);

  const timeAgo = formatDistanceToNow(new Date(drawing._creationTime), {
    addSuffix: true,
  });

  return (
    <Link href={`/d/${drawing._id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">
            {drawing.name}
          </h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {drawing.twitterHandle ? `@${drawing.twitterHandle}` : "Anonymous"}
            </span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}


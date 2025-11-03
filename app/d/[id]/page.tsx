"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrawingReplay } from "@/components/DrawingReplay";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DrawingPage() {
  const params = useParams();
  const id = params.id as Id<"drawings">;

  const drawing = useQuery(api.drawings.getDrawing, { id });

  if (drawing === undefined) {
    return (
      <div className="min-h-screen bg-red-600">
        <header className="p-4">
          <Link
            href="/"
            className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2"
          >
            <span className="text-lg">←</span>
            <span>Back to Drawing</span>
          </Link>
        </header>
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </main>
      </div>
    );
  }

  if (drawing === null) {
    return (
      <div className="min-h-screen bg-red-600">
        <header className="p-4">
          <Link
            href="/"
            className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2"
          >
            <span className="text-lg">←</span>
            <span>Back to Drawing</span>
          </Link>
        </header>
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Drawing not found</h2>
            <Link href="/" className="underline hover:no-underline">
              Go back to drawing
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/d/${id}` : "";

  return (
    <div className="min-h-screen bg-red-600">
      <header className="p-4">
        <Link
          href="/"
          className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2"
        >
          <span className="text-lg">←</span>
          <span>Back to Drawing</span>
        </Link>
      </header>
      <main className="min-h-screen">
        <DrawingReplay
          points={drawing.points}
          canvasWidth={drawing.canvasWidth}
          canvasHeight={drawing.canvasHeight}
          name={drawing.name}
          twitterHandle={drawing.twitterHandle}
          shareUrl={shareUrl}
        />
      </main>
    </div>
  );
}

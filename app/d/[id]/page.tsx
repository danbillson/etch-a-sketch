"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrawingReplay } from "@/components/DrawingReplay";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
        <main className="min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-screen p-6">
            {/* Header skeleton */}
            <div className="text-center mb-2">
              <Skeleton className="h-9 w-64 mb-2 bg-white/20 mx-auto" />
              <Skeleton className="h-4 w-32 bg-white/20 mx-auto" />
            </div>

            {/* Canvas skeleton */}
            <div className="shrink-0 w-full md:w-auto flex justify-center mb-8">
              <div className="w-full max-w-full md:max-w-none bg-gray-200 dark:bg-gray-300 p-2 rounded-lg border-4 border-red-800">
                <Skeleton className="w-full max-w-[600px] aspect-[3/2] md:w-[600px] md:h-[400px] bg-gray-100 dark:bg-gray-400 rounded" />
              </div>
            </div>

            {/* Buttons skeleton */}
            <div className="flex gap-4 items-center">
              <Skeleton className="h-10 w-32 rounded-full bg-white/20" />
              <Skeleton className="h-10 w-40 rounded-full bg-white/20" />
            </div>
          </div>
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

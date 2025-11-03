"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrawingReplay } from "@/components/DrawingReplay";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DrawingPage() {
  const params = useParams();
  const id = params.id as string;

  const drawing = useQuery(api.drawings.getDrawing, { id });

  if (drawing === undefined) {
    return (
      <>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
          <h1 className="text-xl font-bold">Etch-A-Sketch</h1>
          <Link href="/" className="text-sm underline hover:no-underline">
            ← Back to Drawing
          </Link>
        </header>
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  if (drawing === null) {
    return (
      <>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
          <h1 className="text-xl font-bold">Etch-A-Sketch</h1>
          <Link href="/" className="text-sm underline hover:no-underline">
            ← Back to Drawing
          </Link>
        </header>
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Drawing not found</h2>
            <Link href="/">
              <button className="text-primary underline hover:no-underline">
                Go back to drawing
              </button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/d/${id}` : "";

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold">Etch-A-Sketch</h1>
        <Link href="/" className="text-sm underline hover:no-underline">
          ← Back to Drawing
        </Link>
      </header>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8">
        <DrawingReplay
          points={drawing.points}
          canvasWidth={drawing.canvasWidth}
          canvasHeight={drawing.canvasHeight}
          name={drawing.name}
          twitterHandle={drawing.twitterHandle}
          shareUrl={shareUrl}
        />
      </main>
    </>
  );
}


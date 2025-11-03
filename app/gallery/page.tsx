"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrawingCard } from "@/components/DrawingCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GalleryPage() {
  const result = useQuery(api.drawings.listDrawings, {
    paginationOpts: {
      numItems: 20,
      cursor: null,
    },
  });

  if (result === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading gallery...</p>
      </div>
    );
  }

  const { page, isDone, continueCursor } = result;

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold">Gallery</h1>
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Back to Drawing
          </Button>
        </Link>
      </header>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {page.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">No drawings yet</h2>
              <p className="text-muted-foreground mb-6">
                Be the first to create something amazing!
              </p>
              <Link href="/">
                <Button>Start Drawing</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {page.map((drawing) => (
                  <DrawingCard key={drawing._id} drawing={drawing} />
                ))}
              </div>
              {!isDone && (
                <div className="text-center mt-8">
                  <p className="text-sm text-muted-foreground">
                    More drawings available...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}


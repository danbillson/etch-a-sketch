"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrawingCard } from "@/components/DrawingCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function GalleryPage() {
  const result = useQuery(api.drawings.listDrawings, {
    paginationOpts: {
      numItems: 20,
      cursor: null,
    },
  });

  if (result === undefined) {
    return (
      <div className="min-h-screen bg-red-600">
        <header className="p-4">
          <Link href="/" className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2">
            <span className="text-lg">←</span>
            <span>Back to Drawing</span>
          </Link>
        </header>
        <main className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { page, isDone, continueCursor } = result;

  return (
    <div className="min-h-screen bg-red-600">
      <header className="p-4">
        <Link href="/" className="text-white hover:text-gray-200 transition-colors inline-flex items-center gap-2">
          <span className="text-lg">←</span>
          <span>Back to Drawing</span>
        </Link>
      </header>
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {page.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4 text-white">No drawings yet</h2>
              <p className="text-white/80 mb-6">
                Be the first to create something amazing!
              </p>
              <Link href="/">
                <Button className="bg-white hover:bg-gray-100">Start Drawing</Button>
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
                  <p className="text-sm text-white/80">
                    More drawings available...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}


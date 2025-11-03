"use client";

import { EtchASketch } from "@/components/EtchASketch";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold">Etch-A-Sketch</h1>
        <Link href="/gallery">
          <Button variant="outline" size="sm">
            Gallery
          </Button>
        </Link>
      </header>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8">
        <EtchASketch />
      </main>
    </>
  );
}

"use client";

import { TransferWidget } from "@/components/transection/TransferWidget";

export default function TransferPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Cross-Chain Transfer</h1>
          <p className="text-muted-foreground mt-1">
            Transfer from one blockchain network to another
          </p>
        </div>
        <TransferWidget />
      </div>
    </main>
  );
}

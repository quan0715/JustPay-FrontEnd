"use client";

import { TransferWidget } from "@/components/transaction/TransferWidget";

export default function TransferPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <TransferWidget />
      </div>
    </main>
  );
}

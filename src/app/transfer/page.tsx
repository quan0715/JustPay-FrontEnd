"use client";

import { TransferWidget } from "@/components/transection/TransferWidget";

export default function TransferPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">跨鏈轉賬</h1>
          <p className="text-muted-foreground mt-1">
            從一個區塊鏈網絡轉賬到另一個區塊鏈網絡
          </p>
        </div>
        <TransferWidget />
      </div>
    </main>
  );
}

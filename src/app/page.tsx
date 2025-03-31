"use client";
// import { useState } from "react";

import "@rainbow-me/rainbowkit/styles.css";
import { AuthStatus } from "@/components/AuthStatus";

export default function Home() {
  // const [address, setAddress] = useState("");
  // const [accountInfo, setAccountInfo] = useState<any>(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");
  //   setAccountInfo(null);

  //   try {
  //     const response = await fetch(`/api/rpc-test?address=${address}`);
  //     const data = await response.json();

  //     if (response.ok) {
  //       setAccountInfo(data);
  //     } else {
  //       setError(data.error || "查詢失敗");
  //     }
  //   } catch (err) {
  //     setError("發生錯誤，請稍後再試");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <main className="min-h-screen p-8 bg-background">
      {/* <ConnectButton /> */}
      <div className="max-w-2xl mx-auto space-y-6">
        <AuthStatus />
      </div>
    </main>
  );
}

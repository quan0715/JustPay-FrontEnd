"use client"; // 記得要 client component 才能使用瀏覽器 API

import React, { useEffect, useState } from "react";

export default function SseDemoPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 連線到我們剛建立的 SSE 路由
    const eventSource = new EventSource("/api/sse");
    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    // 若發生錯誤，可以在這裡監聽
    eventSource.onerror = (err) => {
      console.error("SSE error", err);
      eventSource.close();
    };

    // 組件卸載 (unmount) 時關閉連線，避免記憶體浪費
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>SSE Demo</h1>
      <div>
        {logs.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </div>
  );
}

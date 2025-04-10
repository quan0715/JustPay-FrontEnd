// app/api/sse/route.ts
export async function GET() {
  // 為了回傳 SSE，需要設定正確的 Headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 透過 Web Stream API 建立可讀的串流
  const stream = new ReadableStream({
    start(controller) {
      // 這個 start 函式會在有人請求 GET 時被呼叫
      let count = 0;

      // 每秒推送一次訊息，共推送十次
      const intervalId = setInterval(() => {
        count++;
        // SSE 格式：`data: ...\n\n`
        const message = `data: Hello SSE! Count: ${count}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));

        if (count >= 10) {
          // 十次後結束推送
          clearInterval(intervalId);
          controller.close();
        }
      }, 1000);
    },
  });

  return new Response(stream, { headers });
}

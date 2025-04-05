"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

interface QrScannerProps {
  onResult: (result: string) => void;
}

const QrScanner = ({ onResult }: QrScannerProps) => {
  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    qrScanner.render(
      (result) => {
        onResult(result);
        qrScanner.clear();
      },
      (error) => {
        console.error(error);
      }
    );

    return () => {
      qrScanner.clear();
    };
  }, [onResult]);

  return <div id="qr-reader" className="w-full" />;
};

export default QrScanner;

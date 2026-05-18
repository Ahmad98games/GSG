import React from "react";
import DownloadClient from "./DownloadClient";

export const metadata = {
  title: 'Download Noxis ERP — Windows .exe and Android APK',
  description: 'Download Noxis Industrial ERP. Windows PC installer (.exe) and Android app (.apk). Free 3-day Elite trial. Works offline on local network.',
};

export default function DownloadPage() {
  return <DownloadClient />;
}

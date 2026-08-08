export function generateStaticParams() {
  return [{ channel: 'stable' }];
}

export default function DownloadChannelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

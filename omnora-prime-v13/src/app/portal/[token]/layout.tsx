export function generateStaticParams() {
  return [{ token: 'placeholder' }];
}

export default function PortalTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

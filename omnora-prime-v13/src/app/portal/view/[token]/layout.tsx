export function generateStaticParams() {
  return [{ token: 'placeholder' }];
}

export default function PortalViewTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

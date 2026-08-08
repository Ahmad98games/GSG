export function generateStaticParams() {
  return [{ sessionId: 'placeholder' }];
}

export default function AuditSessionIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

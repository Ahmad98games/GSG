export function generateStaticParams() {
  return [{ identityId: 'placeholder' }];
}

export default function KarigarSharedIdentityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

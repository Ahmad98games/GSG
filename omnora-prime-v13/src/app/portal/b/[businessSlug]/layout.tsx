export function generateStaticParams() {
  return [{ businessSlug: 'placeholder' }];
}

export default function PortalBusinessSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

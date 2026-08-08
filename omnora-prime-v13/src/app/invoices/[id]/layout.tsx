export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function InvoiceIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function generateStaticParams() {
  return [{ poId: 'placeholder' }];
}

export default function PurchasePoIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

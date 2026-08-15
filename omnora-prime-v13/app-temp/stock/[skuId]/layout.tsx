export function generateStaticParams() {
  return [{ skuId: 'placeholder' }];
}

export default function StockSkuIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

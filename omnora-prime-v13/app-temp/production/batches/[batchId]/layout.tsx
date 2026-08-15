export function generateStaticParams() {
  return [{ batchId: 'placeholder' }];
}

export default function ProductionBatchIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

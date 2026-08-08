export function generateStaticParams() {
  return [{ periodId: 'placeholder' }];
}

export default function PayrollPeriodIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

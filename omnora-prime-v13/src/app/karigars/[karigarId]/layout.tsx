export function generateStaticParams() {
  return [{ karigarId: 'placeholder' }];
}

export default function KarigarIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

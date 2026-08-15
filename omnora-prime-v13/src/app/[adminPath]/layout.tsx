export function generateStaticParams() {
  return [{ adminPath: 'admin' }];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

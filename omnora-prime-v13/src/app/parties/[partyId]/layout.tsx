export function generateStaticParams() {
  return [{ partyId: 'placeholder' }];
}

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

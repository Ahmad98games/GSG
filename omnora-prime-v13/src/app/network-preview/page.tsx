import { Metadata } from 'next';
import NetworkPreviewClient from './NetworkPreviewClient';

export const metadata: Metadata = {
  title: 'Noxis Factory Network — B2B Marketplace for Industrial Factories',
  description: 'Connect with verified industrial factories across Pakistan, UAE, Bangladesh, Turkey, Indonesia, and beyond. Trade direct goods, optimize supply chains, and liquidate surplus materials on Noxis Hub.',
  openGraph: {
    title: 'Noxis Factory Network — B2B Marketplace for Industrial Factories',
    description: 'Connect with verified industrial factories across Pakistan, UAE, Bangladesh, Turkey, Indonesia, and beyond. Trade direct goods, optimize supply chains, and liquidate surplus materials on Noxis Hub.',
    type: 'website',
  },
};

export default function NetworkPreviewPage() {
  return <NetworkPreviewClient />;;
}

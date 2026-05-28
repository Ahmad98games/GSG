import React from 'react';
import { getBlogPosts } from '@/lib/blog-utils';
import BlogListingClient from './BlogListingClient';

export const metadata = {
  title: 'Noxis Blog — Industrial Factory Management Guides',
  description: 'Guides and insights on managing textile mills, karigar payroll, active CCTV safety, and offline-first inventory systems in Pakistan.',
};

export default async function BlogIndexPage() {
  const posts = getBlogPosts();
  return <BlogListingClient posts={posts} />;
}

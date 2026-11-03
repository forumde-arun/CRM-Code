import Shell from '@/components/Shell';

// Signed-in pages are private: keep them out of search results.
export const metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }) {
  return <Shell>{children}</Shell>;
}

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatButton from '@/components/ChatButton';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className='pt-16'>{children}</main>
      <Footer />
      <ChatButton />
    </>
  );
}

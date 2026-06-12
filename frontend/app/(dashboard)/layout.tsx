import Sidebar from '@/components/dashboard/Sidebar';
import ChatButton from '@/components/ChatButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#fafafa]'>
      <Sidebar />
      <div className='ml-56 flex flex-col min-h-screen'>{children}</div>
      <ChatButton />
    </div>
  );
}

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import DirSync from '@/components/DirSync';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DirSync />
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}

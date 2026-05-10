import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ChatButton from './components/ChatButton';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Features from './pages/Features';
import Support from './pages/Support';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <main className='pt-16'>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/pricing' element={<Pricing />} />
            <Route path='/features' element={<Features />} />
            <Route path='/support' element={<Support />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ChatButton />
      </BrowserRouter>
    </ThemeProvider>
  );
}

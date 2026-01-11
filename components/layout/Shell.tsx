import { Navbar } from './Navbar';
import { ModeNavigation } from './ModeNavigation';
import { Footer } from './Footer';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <ModeNavigation />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

import { Shell } from '../layout/Shell';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <Shell>{children}</Shell>;
}

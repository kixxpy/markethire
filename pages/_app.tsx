import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "../styles/globals.css";
import Layout from "../components/common/Layout";
import { useAuthStore } from "../src/store/authStore";
import { Toaster } from "sonner";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export default function App({ Component, pageProps }: AppProps) {
  const init = useAuthStore((state) => state.init);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const activeMode = useAuthStore((state) => state.activeMode);

  useEffect(() => {
    init();
  }, [init]);

  // Обработка автоматического logout при недействительном токене
  useEffect(() => {
    const handleLogout = () => {
      logout();
      router.push('/');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout, router]);

  // Редирект на главную при перезагрузке, если пользователь не авторизован
  useEffect(() => {
    // Публичные страницы, на которых можно находиться без авторизации
    const publicPaths = ['/', '/login', '/register', '/tasks', '/performers', '/vacancies', '/about', '/privacy', '/contacts'];
    const isPublicPath = publicPaths.some(path => {
      if (path === '/') {
        return router.pathname === '/';
      }
      return router.pathname.startsWith(path);
    });

    // Если пользователь не авторизован и находится не на публичной странице, редиректим на главную
    if (!isAuthenticated && !isPublicPath && router.isReady) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    document.documentElement.classList.add(inter.variable);
    document.documentElement.classList.add(inter.className);
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (activeMode === 'SELLER' && url.startsWith('/seller')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSellerPath', url);
        }
      } else if (activeMode === 'PERFORMER' && url.startsWith('/executor')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastPerformerPath', url);
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, activeMode]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Layout>
        <Component {...pageProps} />
        <Toaster 
          position="top-right" 
          closeButton={true}
        />
      </Layout>
    </ThemeProvider>
  );
}

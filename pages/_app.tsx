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
  const router = useRouter();
  const activeMode = useAuthStore((state) => state.activeMode);

  useEffect(() => {
    init();
  }, [init]);

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
        <Toaster position="top-right" />
      </Layout>
    </ThemeProvider>
  );
}

import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import Header from "@/components/Layout/Header/Header";
import Footer from "@/components/Layout/Footer";
import { ZustandHydration } from "@/store/ZustandHidration";
import { cookies } from "next/headers";
import { getLayoutData } from "@/shared/api/content";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get("bruska_authorized")?.value === "1";
  const userName = isAuthorized ? cookieStore.get("bruska_user")?.value : undefined;
  const userRole = isAuthorized ? cookieStore.get("bruska_role")?.value : undefined;
  const isAdmin = isAuthorized && (userRole ?? "").toLowerCase() === "admin";
  const isUser = isAuthorized && !isAdmin;

  const layoutData = await getLayoutData(isAuthorized, userName);

  return (
    <html suppressHydrationWarning lang="en" data-scroll-behavior="smooth">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-mainbg font-sans antialiased flex flex-col",
          fontSans.variable
        )}
      >
        {(isAdmin || isUser) && (
          <div
            className={`fixed top-0 left-0 w-full h-[50px] text-white z-[100] flex items-center justify-between px-4 font-semibold ${isAdmin ? "bg-red-600" : "bg-[#1f7a1f]"}`}
          >
            <span>{isAdmin ? "вы вошли как админ" : `Вы вошли как ${userName ?? "пользователь"}`}</span>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <a
                  href="/admin"
                  className="h-8 px-3 rounded-md bg-white text-red-700 text-sm font-semibold flex items-center"
                >
                  Перейти в панель
                </a>
              ) : null}
              <a
                href="/admin-logout"
                className={`h-8 px-3 rounded-md bg-white text-sm font-semibold flex items-center ${isAdmin ? "text-red-700" : "text-[#1f7a1f]"}`}
              >
                Выйти
              </a>
            </div>
          </div>
        )}
        <ZustandHydration />
        <div className={isAuthorized ? "pt-[50px] flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
          <Header navItems={layoutData.navItems} isAuthorized={isAuthorized} />
          <main className="grow bg-mainbg">{children}</main>
          <Footer data={layoutData.footer} />
        </div>
      </body>
    </html>
  );
}

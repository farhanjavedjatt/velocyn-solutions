import "./globals.css";

export const metadata = {
  title: "Velocyn Solutions — Software, shipped.",
  icons: {
    icon: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1D3461",
};

export default function RootLayout({ children }) {
  return (
    /* data-booting ships in the SSR markup so the fixed header can't
       flash in ahead of the loading overlay on slow connections (the
       overlay's markup lives deep inside <main> and arrives later in
       the progressive parse). SiteScrub removes the attribute when the
       drawer reveal starts; the <noscript> style un-hides the header
       for JS-disabled visitors. */
    <html lang="en" data-booting="">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <noscript>
          <style>{`html[data-booting] .chrome { visibility: visible; pointer-events: auto; }`}</style>
        </noscript>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

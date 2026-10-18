import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata = {
  title: "Nirvana Health Chain — Anti-Counterfeit Pharmaceutical Network",
  description: "Decentralized Drug Supply Chain Verification & Traceability Protocol.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${ebGaramond.variable} dark`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("app_theme");
                if (saved === "light") {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                } else if (saved === "dark") {
                  document.documentElement.classList.remove("light");
                  document.documentElement.classList.add("dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#00e5ff]/30 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


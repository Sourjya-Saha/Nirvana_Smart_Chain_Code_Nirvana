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
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable} dark`}>
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


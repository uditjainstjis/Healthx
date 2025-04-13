// src/app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider"; // Make sure this import is correct
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

// Metadata can be exported separately
export const metadata = {
  title: "HealthGuard AI",
  description: "Your personal AI-powered health companion",
};

// --- THIS IS THE CRITICAL PART ---
export default function RootLayout({ children }) { // Must be 'export default function'
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider // Ensure ThemeProvider itself is a valid component
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* Toaster might be here */}
        </ThemeProvider>
      </body>
    </html>
  );
}
// --- END CRITICAL PART ---
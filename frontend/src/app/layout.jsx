import { ibmPlexSans, pressStart } from "@/fonts";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "AlumNet",
  description: "An Alumni Management System for PSTU",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", ibmPlexSans.variable, pressStart.variable)}
    >
      <body className="min-h-full  mx-auto max-w-[1750px] flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

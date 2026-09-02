import { ibmPlexSans, pressStart } from "@/fonts";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import AiChatbot from "@/components/shared/AiChatbot";
import { ToastContainer } from "react-toastify";

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
      <body suppressHydrationWarning className="min-h-full mx-auto max-w-[1750px] flex flex-col">
        <AuthProvider>
          {children}
          <AiChatbot />
          <ToastContainer
            position="top-right"
            autoClose={1500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </body>
    </html>
  );
}

import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthenticatedBackground from "./components/AuthenticatedBackground";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "CareerIQ — Market-Aware AI Career Intelligence",
  description:
    "Analyze your resume, discover in-demand skills, understand your skill gaps, and explore career opportunities using real job-market insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <AuthenticatedBackground />
        {children}
      </body>
    </html>
  );
}

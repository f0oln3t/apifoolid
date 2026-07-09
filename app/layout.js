import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import Contributors from "@/components/Contributors";

export const metadata = {
  title: "APi.foolid — direktori API scrape komunitas",
  description:
    "Tempat share API publik yang di-scrape oleh komunitas. Dibangun oleh user yang login, ditenagai Firebase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          <Navbar />
          <div className="shell">{children}</div>
          <footer>
            <div className="footer-inner">
              <Contributors />
              <div className="footer-meta">
                <span>APi.foolid — dibangun komunitas, ditenagai Firebase.</span>
                <span>data publik, dibuat oleh user yang sudah login</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}

import '@/app/globals.css';
import { SessionProvider } from '@/context/SessionContext';
import Link from 'next/link';

export const metadata = {
  title: 'AI Stadium Companion | MetLife Stadium',
  description: 'Your premium AI assistant for wayfinding, game stats, and emergency guidance at MetLife Stadium.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <header className="app-header">
            <div className="header-container">
              <Link href="/" className="logo">
                <span className="logo-icon">🏟️</span>
                <span>AI Stadium Companion</span>
              </Link>
              <nav>
                <ul className="nav-links">
                  <li>
                    <Link href="/dashboard" className="nav-link">
                      Fan Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/chat" className="nav-link">
                      AI Chat
                    </Link>
                  </li>
                  <li>
                    <Link href="/navigation" className="nav-link">
                      Interactive Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="nav-link">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/staff/login" className="nav-link nav-cta">
                      Staff Portal
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
          <main className="main-content">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

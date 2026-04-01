import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IAT — Internship Application Tracker',
  description: 'Track every application, interview, and opportunity in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="nav">
          <a href="/" className="nav-logo">IAT<span>.</span></a>
          <div className="nav-links">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/applications" className="nav-link">Applications</a>
            <a href="/companies" className="nav-link">Companies</a>
            <a href="/contacts" className="nav-link">Contacts</a>
          </div>
        </nav>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}

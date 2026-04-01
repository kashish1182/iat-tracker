import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IAT — Internship Application Tracker',
  description: 'Track every application, interview, and opportunity in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <nav className="nav">
          <a href="/" className="nav-logo">IAT</a>
          <div className="nav-links">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/applications" className="nav-link">Applications</a>
            <a href="/companies" className="nav-link">Companies</a>
            <a href="/contacts" className="nav-link">Contacts</a>
          </div>
        </nav>
        <main className="main">{children}</main>
        <div className="statusbar">
          <div className="statusbar-panel">IAT — Internship Application Tracker</div>
          <div className="statusbar-panel">Ready</div>
          <div className="statusbar-panel" style={{ marginLeft: 'auto' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </body>
    </html>
  );
}

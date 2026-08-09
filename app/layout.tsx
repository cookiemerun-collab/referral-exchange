import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Referral Exchange",
  description:
    "A community-driven referral trading platform built around real trades and real reputation."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <Link href="/" className="logo">
            REFERRAL<span>EXCHANGE</span>
          </Link>

          <nav className="navLinks">
            <Link href="/events">Events</Link>
            <Link href="/trades">Trades</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/auth" className="primary">
              Sign In
            </Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}

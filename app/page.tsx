import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="badge">
          REAL PEOPLE • REAL TRADES • REAL STATS
        </div>

        <h1>
          Trade referrals.
          <br />
          <span>Build trust.</span>
        </h1>

        <p>
          Find people participating in the same event, trade referrals,
          communicate in a dedicated trade room, and build a reputation
          from verified trades.
        </p>

        <div className="buttons">
          <Link href="/trades" className="primary">
            Find a Trade
          </Link>

          <Link href="/auth" className="secondary">
            Create Account
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="number">01</div>
          <h2>Find a Match</h2>
          <p>
            Find people looking for the same type of referral you need.
          </p>
        </div>

        <div className="feature">
          <div className="number">02</div>
          <h2>Trade Safely</h2>
          <p>
            Every trade gets its own conversation and completion status.
          </p>
        </div>

        <div className="feature">
          <div className="number">03</div>
          <h2>Build Reputation</h2>
          <p>
            Reviews and statistics come from real completed trades.
          </p>
        </div>
      </section>

      <section className="trust">
        <div>
          <div className="smallTitle">THE GOLDEN RULE</div>

          <h2>
            If the database can't prove it happened,
            <span> it doesn't count.</span>
          </h2>
        </div>

        <p>
          Completed trades, reviews, ratings and leaderboard positions
          are generated from real database records. Users cannot simply
          type their own statistics.
        </p>
      </section>
    </main>
  );
}

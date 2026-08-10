import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TradeRoomPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          <h2>You need to sign in.</h2>

          <Link
            href="/auth"
            className="primary"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="contentPage">
      <section className="pageHeader">
        <div>
          <div className="badge">TRADE ROOM</div>

          <h1>Your Trades</h1>

          <p>
            Open your active trades and continue your
            conversations.
          </p>
        </div>
      </section>

      <TradeList userId={user.id} />
    </main>
  );
}

async function TradeList({
  userId,
}: {
  userId: string;
}) {
  const supabase = await createClient();

  const { data: trades } = await supabase
    .from("trades")
    .select(`
      id,
      status,
      created_at,
      requester_id,
      owner_id,
      trade_listings (
        title
      )
    `)
    .or(
      `requester_id.eq.${userId},owner_id.eq.${userId}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (!trades || trades.length === 0) {
    return (
      <div className="emptyState">
        <h2>No trades yet</h2>

        <p>
          When you request a listing or someone requests
          yours, your trade will appear here.
        </p>

        <Link
          href="/events"
          className="primary"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="tradeList">
      {trades.map((trade: any) => (
        <Link
          href={`/trades/${trade.id}`}
          className="tradeRow"
          key={trade.id}
        >
          <div>
            <strong>
              {trade.trade_listings?.title ||
                "Trade"}
            </strong>

            <span>
              {trade.status}
            </span>
          </div>

          <div>
            →
          </div>
        </Link>
      ))}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TradePage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          <h2>Sign in to view this trade.</h2>

          <Link href="/auth" className="primary">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const { data: trade } = await supabase
    .from("trades")
    .select(`
      id,
      status,
      requester_id,
      owner_id,
      created_at,
      completed_at,
      trade_listings (
        id,
        title,
        need_type,
        referral_url
      )
    `)
    .eq("id", tradeId)
    .single();

  if (!trade) {
    notFound();
  }

  const isParticipant =
    trade.requester_id === user.id ||
    trade.owner_id === user.id;

  if (!isParticipant) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          <h2>Access denied</h2>
          <p>You aren't a participant in this trade.</p>
        </div>
      </main>
    );
  }

  const { data: messages } = await supabase
    .from("trade_messages")
    .select(`
      id,
      body,
      sender_id,
      created_at
    `)
    .eq("trade_id", trade.id)
    .order("created_at", {
      ascending: true,
    });

  return (
    <main className="contentPage">
      <Link href="/trades" className="backLink">
        ← My Trades
      </Link>

      <section className="tradeRoom">
        <header className="tradeRoomHeader">
          <div>
            <div className="badge">PRIVATE TRADE</div>

            <h1>
              {(trade.trade_listings as any)?.title ||
                "Trade"}
            </h1>

            <span className="tradeStatus">
              {trade.status.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="tradeRules">
          <strong>Trade protection</strong>

          <p>
            Keep communication inside this room. A trade is
            only counted as completed after both participants
            confirm it.
          </p>
        </div>

        <div className="chatBox">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.sender_id === user.id
                    ? "message own"
                    : "message"
                }
              >
                <span>
                  {message.sender_id === user.id
                    ? "You"
                    : "Other participant"}
                </span>

                <p>{message.body}</p>
              </div>
            ))
          ) : (
            <div className="chatEmpty">
              No messages yet. Start the conversation.
            </div>
          )}
        </div>

        <TradeMessageForm tradeId={trade.id} />

        <TradeConfirmation
          tradeId={trade.id}
          status={trade.status}
        />
      </section>
    </main>
  );
}

function TradeMessageForm({
  tradeId,
}: {
  tradeId: string;
}) {
  return (
    <form
      action="/api/trades/message"
      method="POST"
      className="messageForm"
    >
      <input
        type="hidden"
        name="tradeId"
        value={tradeId}
      />

      <input
        name="body"
        required
        maxLength={1000}
        placeholder="Write a message..."
      />

      <button className="primary">
        Send
      </button>
    </form>
  );
}

function TradeConfirmation({
  tradeId,
  status,
}: {
  tradeId: string;
  status: string;
}) {
  if (
    status === "completed" ||
    status === "cancelled"
  ) {
    return (
      <div className="tradeCompleted">
        This trade is {status}.
      </div>
    );
  }

  return (
    <form
      action="/api/trades/confirm"
      method="POST"
      className="confirmation"
    >
      <input
        type="hidden"
        name="tradeId"
        value={tradeId}
      />

      <button className="secondary">
        Confirm Trade Completed
      </button>

      <small>
        Both participants must confirm before this trade
        becomes officially completed.
      </small>
    </form>
  );
}

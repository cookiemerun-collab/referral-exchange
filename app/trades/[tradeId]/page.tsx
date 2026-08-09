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
        need_type
      )
    `)
    .eq("id", tradeId)
    .single();

  if (!trade) {
    notFound();
  }

  const isRequester =
    trade.requester_id === user.id;

  const isOwner =
    trade.owner_id === user.id;

  if (!isRequester && !isOwner) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          <h2>Access denied</h2>

          <p>
            You aren't a participant in this trade.
          </p>
        </div>
      </main>
    );
  }

  const otherUserId = isRequester
    ? trade.owner_id
    : trade.requester_id;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select(
      "username, display_name, avatar_url"
    )
    .eq("id", otherUserId)
    .single();

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

  let alreadyReviewed = false;

  if (trade.status === "completed") {
    const { data: existingReview } =
      await supabase
        .from("trade_reviews")
        .select("id")
        .eq("trade_id", trade.id)
        .eq("reviewer_id", user.id)
        .maybeSingle();

    alreadyReviewed = !!existingReview;
  }

  return (
    <main className="contentPage">
      <Link href="/trades" className="backLink">
        ← My Trades
      </Link>

      <section className="tradeRoom">
        <header className="tradeRoomHeader">
          <div>
            <div className="badge">
              PRIVATE TRADE
            </div>

            <h1>
              {(trade.trade_listings as any)?.title ||
                "Trade"}
            </h1>

            <span className="tradeStatus">
              {trade.status.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="tradePartner">
          <span>TRADING WITH</span>

          <strong>
            {otherProfile?.display_name ||
              otherProfile?.username ||
              "User"}
          </strong>

          <small>
            @{otherProfile?.username ||
              "unknown"}
          </small>
        </div>

        <div className="tradeRules">
          <strong>Trade protection</strong>

          <p>
            Keep communication inside this room.
            Both participants must confirm the trade
            before it becomes completed.
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
                    : otherProfile?.username ||
                      "Other participant"}
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

        {trade.status !== "completed" &&
          trade.status !== "cancelled" && (
            <TradeMessageForm
              tradeId={trade.id}
            />
          )}

        {trade.status !== "completed" &&
          trade.status !== "cancelled" && (
            <TradeConfirmation
              tradeId={trade.id}
            />
          )}

        {trade.status === "completed" && (
          <ReviewSection
            tradeId={trade.id}
            otherUserId={otherUserId}
            otherUsername={
              otherProfile?.username ||
              "user"
            }
            alreadyReviewed={
              alreadyReviewed
            }
          />
        )}
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

      <button
        className="primary"
        type="submit"
      >
        Send
      </button>
    </form>
  );
}

function TradeConfirmation({
  tradeId,
}: {
  tradeId: string;
}) {
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

      <button
        className="secondary"
        type="submit"
      >
        Confirm Trade Completed
      </button>

      <small>
        Both participants must confirm before
        this trade becomes officially completed.
      </small>
    </form>
  );
}

function ReviewSection({
  tradeId,
  otherUserId,
  otherUsername,
  alreadyReviewed,
}: {
  tradeId: string;
  otherUserId: string;
  otherUsername: string;
  alreadyReviewed: boolean;
}) {
  if (alreadyReviewed) {
    return (
      <div className="reviewSubmitted">
        <strong>Review submitted</strong>

        <span>
          You have already reviewed @{otherUsername}
          for this trade.
        </span>
      </div>
    );
  }

  return (
    <section className="tradeReview">
      <div className="badge">
        TRADE COMPLETED
      </div>

      <h2>
        How was your trade with @{otherUsername}?
      </h2>

      <form
        action="/api/trades/review"
        method="POST"
        className="reviewForm"
      >
        <input
          type="hidden"
          name="tradeId"
          value={tradeId}
        />

        <input
          type="hidden"
          name="reviewedId"
          value={otherUserId}
        />

        <label>
          Rating

          <select
            name="rating"
            required
            defaultValue="5"
          >
            <option value="5">
              5 — Excellent
            </option>

            <option value="4">
              4 — Good
            </option>

            <option value="3">
              3 — Okay
            </option>

            <option value="2">
              2 — Poor
            </option>

            <option value="1">
              1 — Very poor
            </option>
          </select>
        </label>

        <label>
          Comment

          <textarea
            name="comment"
            maxLength={500}
            rows={4}
            placeholder="How did the trade go?"
          />
        </label>

        <button
          className="primary"
          type="submit"
        >
          Submit Verified Review
        </button>
      </form>
    </section>
  );
}

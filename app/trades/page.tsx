import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TradesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings, error } = await supabase
    .from("trade_listings")
    .select(`
      id,
      title,
      description,
      need_type,
      status,
      created_at,
      owner_id,
      events (
        name,
        slug
      ),
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="page">
        <section className="detailCard">
          <h1>Trades</h1>
          <p className="detailDescription">
            Unable to load trades right now.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Trades</h1>
          <p className="authDescription">
            Find someone to trade a referral with.
          </p>
        </div>

        {user && (
          <Link href="/trades/new" className="primary">
            Create Listing
          </Link>
        )}
      </div>

      {!listings || listings.length === 0 ? (
        <section className="detailCard">
          <h2>No open trades yet.</h2>
          <p className="detailDescription">
            Be the first person to create a referral trade.
          </p>

          {user && (
            <Link
              href="/trades/new"
              className="primary detailButton"
            >
              Create a Trade
            </Link>
          )}
        </section>
      ) : (
        <div className="listingGrid">
          {listings.map((listing) => {
            const profile = listing.profiles as any;
            const event = listing.events as any;

            return (
              <Link
                key={listing.id}
                href={`/trades/${listing.id}`}
                className="listingCard"
              >
                <div className="listingTop">
                  <span className="listingType">
                    {listing.need_type === "new"
                      ? "NEW USER"
                      : "EXISTING USER"}
                  </span>

                  <span className="openDot">
                    OPEN
                  </span>
                </div>

                <h2>{listing.title}</h2>

                <p className="detailDescription">
                  {listing.description ||
                    "No description provided."}
                </p>

                <div className="detailInfo">
                  <div>
                    <span>EVENT</span>
                    <strong>
                      {event?.name || "Unknown event"}
                    </strong>
                  </div>

                  <div>
                    <span>POSTED BY</span>
                    <strong>
                      {profile?.display_name ||
                        profile?.username ||
                        "User"}
                    </strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

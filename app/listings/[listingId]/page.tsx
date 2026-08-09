import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;

  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("trade_listings")
    .select(`
      id,
      event_id,
      owner_id,
      title,
      description,
      need_type,
      referral_url,
      status,
      created_at,
      expires_at
    `)
    .eq("id", listingId)
    .single();

  if (!listing) {
    notFound();
  }

  const { data: owner } = await supabase
    .from("profile_reputation")
    .select(`
      user_id,
      username,
      display_name,
      avatar_url,
      average_rating,
      review_count
    `)
    .eq("user_id", listing.owner_id)
    .single();

  const isExpired =
    listing.expires_at &&
    new Date(listing.expires_at) < new Date();

  const isClosed =
    listing.status !== "active" || isExpired;

  return (
    <main className="contentPage">
      <Link href="/events" className="backLink">
        ← Back to Events
      </Link>

      <section className="listingDetail">
        <div className="listingHeader">
          <div>
            <div className="badge">
              {isClosed ? "CLOSED" : "ACTIVE LISTING"}
            </div>

            <h1>{listing.title}</h1>

            <p className="listingDescription">
              {listing.description ||
                "No description provided."}
            </p>
          </div>
        </div>

        <div className="listingGrid">
          <div className="listingMain">
            <div className="listingCard">
              <span className="listingLabel">
                WHAT THEY NEED
              </span>

              <strong>
                {String(listing.need_type)}
              </strong>
            </div>

            <div className="listingCard">
              <span className="listingLabel">
                REFERRAL LINK
              </span>

              {isClosed ? (
                <div className="closedLink">
                  This listing is no longer active.
                </div>
              ) : (
                <a
                  href={listing.referral_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="referralButton"
                >
                  Open Referral Link ↗
                </a>
              )}
            </div>

            <div className="listingCard">
              <span className="listingLabel">
                POSTED
              </span>

              <strong>
                {new Date(
                  listing.created_at
                ).toLocaleDateString()}
              </strong>
            </div>

            {listing.expires_at && (
              <div className="listingCard">
                <span className="listingLabel">
                  EXPIRES
                </span>

                <strong>
                  {new Date(
                    listing.expires_at
                  ).toLocaleDateString()}
                </strong>
              </div>
            )}
          </div>

          <aside className="listingSidebar">
            <div className="sellerCard">
              <span className="listingLabel">
                POSTED BY
              </span>

              <div className="sellerIdentity">
                <div className="profileAvatar small">
                  {(
                    owner?.display_name ||
                    owner?.username ||
                    "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {owner?.display_name ||
                      owner?.username ||
                      "User"}
                  </strong>

                  <span>
                    @{owner?.username ||
                      "unknown"}
                  </span>
                </div>
              </div>

              {owner && (
                <div className="sellerRating">
                  <strong>
                    ⭐{" "}
                    {Number(
                      owner.average_rating
                    ).toFixed(2)}
                  </strong>

                  <span>
                    {owner.review_count} reviews
                  </span>
                </div>
              )}

              {owner?.username && (
                <Link
                  href={`/profile/${owner.username}`}
                  className="secondary sellerProfileButton"
                >
                  View Profile
                </Link>
              )}
            </div>

            {!isClosed && (
              <div className="requestCard">
                <h2>Want to trade?</h2>

                <p>
                  Send a trade request to the
                  listing owner.
                </p>

                <form
                  action="/api/trades/request"
                  method="POST"
                >
                  <input
                    type="hidden"
                    name="listingId"
                    value={listing.id}
                  />

                  <button
                    type="submit"
                    className="primary requestButton"
                  >
                    Request Trade
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

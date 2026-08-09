import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!event) {
    notFound();
  }

  const { data: listings } = await supabase
    .from("trade_listings")
    .select(
      `
        id,
        title,
        description,
        need_type,
        referral_url,
        created_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `
    )
    .eq("event_id", event.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <main className="contentPage">
      <section className="pageHeader eventHeader">
        <div>
          <div className="badge">ACTIVE EVENT</div>

          <h1>{event.name}</h1>

          <p>
            {event.description}
          </p>
        </div>

        <Link
          href={`/trades/new?event=${event.id}`}
          className="primary"
        >
          Create Listing
        </Link>
      </section>

      <div className="listingToolbar">
        <div>
          <strong>{listings?.length || 0}</strong>{" "}
          open listings
        </div>

        <Link href="/leaderboard">
          View Leaderboard →
        </Link>
      </div>

      {listings && listings.length > 0 ? (
        <div className="listingGrid">
          {listings.map((listing: any) => (
            <article
              className="listingCard"
              key={listing.id}
            >
              <div className="listingTop">
                <span className="listingType">
                  {listing.need_type === "new"
                    ? "NEW USER"
                    : "EXISTING USER"}
                </span>

                <span className="openDot">
                  ● OPEN
                </span>
              </div>

              <h2>{listing.title}</h2>

              <p>
                {listing.description ||
                  "No description provided."}
              </p>

              <div className="listingUser">
                <div className="avatar">
                  {(listing.profiles?.display_name ||
                    listing.profiles?.username ||
                    "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {listing.profiles?.display_name ||
                      listing.profiles?.username ||
                      "User"}
                  </strong>

                  <span>
                    @{listing.profiles?.username}
                  </span>
                </div>
              </div>

              <Link
                href={`/trades/${listing.id}`}
                className="secondary listingButton"
              >
                View Listing
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <h2>No listings yet</h2>
          <p>
            Be the first person to create a listing for
            this event.
          </p>
        </div>
      )}
    </main>
  );
}

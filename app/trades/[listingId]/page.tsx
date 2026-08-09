import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { listingId } = await params;
const { error: requestError } =
  await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("trade_listings")
    .select(`
      id,
      title,
      description,
      need_type,
      referral_url,
      status,
      created_at,
      owner_id,
      event_id,
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
    .eq("id", listingId)
    .single();

  if (!listing) {
    notFound();
  }

  const isOwner = user?.id === listing.owner_id;

  return (
    <main className="contentPage">
      <Link href="/events" className="backLink">
        ← Back to events
      </Link>

      <section className="detailCard">
        <div className="listingTop">
          <span className="listingType">
            {listing.need_type === "new"
              ? "NEW USER"
              : "EXISTING USER"}
          </span>

          <span
            className={
              listing.status === "open"
                ? "openDot"
                : "closedStatus"
            }
          >
            {listing.status.toUpperCase()}
          </span>
        </div>

        <h1>{listing.title}</h1>

        <p className="detailDescription">
          {listing.description ||
            "No description provided."}
        </p>

        <div className="detailInfo">
          <div>
            <span>EVENT</span>

            <strong>
              {(listing.events as any)?.name ||
                "Unknown event"}
            </strong>
          </div>

          <div>
            <span>POSTED BY</span>

            <strong>
              {(listing.profiles as any)?.display_name ||
                (listing.profiles as any)?.username ||
                "User"}
            </strong>
          </div>

          <div>
            <span>USERNAME</span>

            <strong>
              @{(listing.profiles as any)?.username ||
                "unknown"}
            </strong>
          </div>
        </div>

        {isOwner ? (
          <div className="ownerNotice">
            This is your listing.
          </div>
        ) : listing.status !== "open" ? (
          <div className="ownerNotice">
            This listing is no longer available.
          </div>
        ) : !user ? (
          <Link
            href="/auth"
            className="primary detailButton"
          >
            Sign in to request this trade
          </Link>
        ) : (
          <form
            action={`/api/trades/request`}
            method="POST"
          >
            <input
              type="hidden"
              name="listingId"
              value={listing.id}
            />

            <button
              className="primary detailButton"
              type="submit"
            >
              Request Trade
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

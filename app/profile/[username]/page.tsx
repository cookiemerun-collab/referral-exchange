import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profile_reputation")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { count: completedTrades } = await supabase
    .from("trades")
    .select("*", {
      count: "exact",
      head: true,
    })
    .or(
      `requester_id.eq.${profile.user_id},owner_id.eq.${profile.user_id}`
    )
    .eq("status", "completed");

  const { data: reviews } = await supabase
    .from("trade_reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer_id,
      profiles!trade_reviews_reviewer_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("reviewed_id", profile.user_id)
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  return (
    <main className="contentPage">
      <section className="profileHero">
        <div className="profileAvatar">
          {(profile.display_name ||
            profile.username ||
            "?")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="profileIdentity">
          <div className="badge">
            VERIFIED TRADER
          </div>

          <h1>
            {profile.display_name ||
              profile.username}
          </h1>

          <p>
            @{profile.username}
          </p>
        </div>
      </section>

      <section className="profileStats">
        <div className="profileStat">
          <strong>
            ⭐{" "}
            {Number(
              profile.average_rating
            ).toFixed(2)}
          </strong>

          <span>
            {profile.review_count} reviews
          </span>
        </div>

        <div className="profileStat">
          <strong>
            {completedTrades || 0}
          </strong>

          <span>
            completed trades
          </span>
        </div>

        <div className="profileStat">
          <strong>
            {profile.review_count > 0
              ? "Verified"
              : "New"}
          </strong>

          <span>
            trader status
          </span>
        </div>
      </section>

      <section className="reviewsSection">
        <div className="sectionHeading">
          <div>
            <div className="badge">
              REVIEWS
            </div>

            <h2>
              What traders say
            </h2>
          </div>
        </div>

        {reviews && reviews.length > 0 ? (
          <div className="reviewList">
            {reviews.map((review: any) => (
              <article
                className="reviewCard"
                key={review.id}
              >
                <div className="reviewTop">
                  <div className="reviewPerson">
                    <div className="avatar">
                      {(
                        review.profiles
                          ?.display_name ||
                        review.profiles
                          ?.username ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {review.profiles
                          ?.display_name ||
                          review.profiles
                            ?.username ||
                          "User"}
                      </strong>

                      <span>
                        @
                        {review.profiles
                          ?.username ||
                          "unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="reviewRating">
                    {"⭐".repeat(
                      review.rating
                    )}
                  </div>
                </div>

                {review.comment && (
                  <p>
                    {review.comment}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <h2>No reviews yet</h2>

            <p>
              This trader hasn't completed
              any reviewed trades yet.
            </p>
          </div>
        )}
      </section>

      <Link
        href="/leaderboard"
        className="secondary profileBack"
      >
        ← Back to leaderboard
      </Link>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: players, error } = await supabase
    .from("reputation_leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(100);

  return (
    <main className="contentPage">
      <section className="pageHeader">
        <div>
          <div className="badge">REPUTATION</div>

          <h1>Leaderboard</h1>

          <p>
            Ranked using verified reviews from completed
            trades.
          </p>
        </div>
      </section>

      {error ? (
        <div className="emptyState">
          <h2>Unable to load leaderboard</h2>
          <p>{error.message}</p>
        </div>
      ) : !players || players.length === 0 ? (
        <div className="emptyState">
          <h2>No ranked users yet</h2>

          <p>
            Complete trades and receive verified reviews
            to appear here.
          </p>
        </div>
      ) : (
        <div className="leaderboard">
          {players.map((player: any) => (
            <div
              className="leaderboardRow"
              key={player.user_id}
            >
              <div className="rank">
                #{player.rank}
              </div>

              <div className="avatar">
                {(player.display_name ||
                  player.username ||
                  "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="playerInfo">
                <Link
                  href={`/profile/${player.username}`}
                  className="leaderboardProfile"
                >
                  <strong>
                    {player.display_name ||
                      player.username ||
                      "User"}
                  </strong>

                  <span>
                    @{player.username}
                  </span>
                </Link>
              </div>

              <div className="rating">
                <strong>
                  ⭐{" "}
                  {Number(
                    player.average_rating
                  ).toFixed(2)}
                </strong>

                <span>
                  {player.review_count}{" "}
                  {player.review_count === 1
                    ? "review"
                    : "reviews"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

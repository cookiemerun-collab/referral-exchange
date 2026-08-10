import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <main className="contentPage">
      <section className="pageHeader">
        <div className="badge">EVENTS</div>

        <h1>Active Events</h1>

        <p>
          Find an event, then browse real community listings and
          eligible trades.
        </p>
      </section>

      {error ? (
        <div className="emptyState">
          Unable to load events.
        </div>
      ) : events && events.length > 0 ? (
        <div className="eventGrid">
          {events.map((event) => (
            <article className="eventCard" key={event.id}>
              <div className="eventStatus">ACTIVE</div>

              <h2>{event.name}</h2>

              <p>
                {event.description ||
                  "Community referral exchange event."}
              </p>

              <Link
                href={`/events/${event.slug}`}
                className="primary"
              >
                View Event
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="emptyState">
          There are currently no active events.
        </div>
      )}
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  name: string;
  slug: string;
};

export default function NewListingPage() {
  const supabase = createClient();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [needType, setNeedType] = useState<"new" | "existing">("new");
  const [referralUrl, setReferralUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setEvents(data || []);

        if (data && data.length > 0) {
          setEventId(data[0].id);
        }
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setSuccess(false);

    if (!eventId) {
      setMessage("Please select an event.");
      setSubmitting(false);
      return;
    }

    const trimmedUrl = referralUrl.trim();

    try {
      const parsedUrl = new URL(trimmedUrl);

      if (parsedUrl.protocol !== "https:") {
        throw new Error("The referral link must use HTTPS.");
      }
    } catch {
      setMessage("Please enter a valid HTTPS referral link.");
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase.from("trade_listings").insert({
      event_id: eventId,
      owner_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      need_type: needType,
      referral_url: trimmedUrl,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already used") ||
        error.message.toLowerCase().includes("today")
      ) {
        setMessage(
          "You've already used your submission for today. Try again tomorrow."
        );
      } else {
        setMessage(error.message);
      }

      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setMessage("Your listing was created successfully.");

    setTitle("");
    setDescription("");
    setReferralUrl("");

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="contentPage">
      <section className="pageHeader">
        <div>
          <div className="badge">NEW LISTING</div>

          <h1>Create a Listing</h1>

          <p>
            Post your referral for other eligible community members
            to find.
          </p>
        </div>
      </section>

      <section className="formCard">
        <form onSubmit={handleSubmit}>
          <label>
            Event

            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              required
            >
              {events.length === 0 ? (
                <option value="">
                  No active events
                </option>
              ) : (
                events.map((event) => (
                  <option
                    value={event.id}
                    key={event.id}
                  >
                    {event.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            Title

            <input
              type="text"
              required
              minLength={3}
              maxLength={80}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: Looking for a new-user referral"
            />

            <small>
              {title.length}/80
            </small>
          </label>

          <label>
            Description

            <textarea
              maxLength={500}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Explain what you're looking for."
              rows={5}
            />

            <small>
              {description.length}/500
            </small>
          </label>

          <label>
            What type of referral do you need?

            <select
              value={needType}
              onChange={(event) =>
                setNeedType(
                  event.target.value as "new" | "existing"
                )
              }
            >
              <option value="new">
                New user
              </option>

              <option value="existing">
                Existing user
              </option>
            </select>
          </label>

          <label>
            Referral Link

            <input
              type="url"
              required
              value={referralUrl}
              onChange={(event) =>
                setReferralUrl(event.target.value)
              }
              placeholder="https://..."
            />

            <small>
              Only HTTPS links are accepted.
            </small>
          </label>

          <div className="dailyLimitNotice">
            <strong>1 submission per day</strong>

            <span>
              Creating this listing uses today's submission.
              You won't be able to create another listing or
              request another trade until tomorrow.
            </span>
          </div>

          <button
            className="primary formSubmit"
            disabled={
              submitting ||
              events.length === 0
            }
          >
            {submitting
              ? "Creating..."
              : "Create Listing"}
          </button>

          {message && (
            <div
              className={
                success
                  ? "formMessage success"
                  : "formMessage"
              }
            >
              {message}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

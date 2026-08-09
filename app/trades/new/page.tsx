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
  const [needType, setNeedType] = useState<
    "new" | "existing"
  >("new");
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
        .order("created_at", {
          ascending: false,
        });

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

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedUrl = referralUrl.trim();

    if (trimmedTitle.length < 3) {
      setMessage("Title must be at least 3 characters.");
      setSubmitting(false);
      return;
    }

    if (trimmedTitle.length > 120) {
      setMessage("Title cannot exceed 120 characters.");
      setSubmitting(false);
      return;
    }

    if (trimmedDescription.length > 1000) {
      setMessage(
        "Description cannot exceed 1000 characters."
      );
      setSubmitting(false);
      return;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);

      if (parsedUrl.protocol !== "https:") {
        throw new Error();
      }
    } catch {
      setMessage(
        "Please enter a valid HTTPS referral link."
      );
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

    /*
     * IMPORTANT:
     * We use the protected database function instead
     * of inserting directly into trade_listings.
     *
     * This means the one-listing-per-day rule is
     * enforced by Supabase itself.
     */

    const { data: listingId, error } =
      await supabase.rpc("create_trade_listing", {
        target_event_id: eventId,
        target_title: trimmedTitle,
        target_description:
          trimmedDescription || null,
        target_need_type: needType,
        target_referral_url: trimmedUrl,
      });

    if (error) {
      const errorMessage =
        error.message.toLowerCase();

      if (
        errorMessage.includes(
          "only create one listing per day"
        )
      ) {
        setMessage(
          "You've already created a listing today. Try again tomorrow."
        );
      } else {
        setMessage(error.message);
      }

      setSubmitting(false);
      return;
    }

    setSuccess(true);

    /*
     * Send the user directly to the listing they
     * just created.
     */

    if (listingId) {
      window.location.href =
        `/listings/${listingId}`;
      return;
    }

    setMessage(
      "Your listing was created successfully."
    );

    setTitle("");
    setDescription("");
    setReferralUrl("");

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="contentPage">
        <div className="emptyState">
          <h2>Loading...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="contentPage">
      <section className="pageHeader">
        <div>
          <div className="badge">
            NEW LISTING
          </div>

          <h1>Create a Listing</h1>

          <p>
            Post your referral for other eligible
            community members to find.
          </p>
        </div>
      </section>

      <section className="formCard">
        <form onSubmit={handleSubmit}>
          <label>
            Event

            <select
              value={eventId}
              onChange={(event) =>
                setEventId(event.target.value)
              }
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
              maxLength={120}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: Looking for a new-user referral"
            />

            <small>
              {title.length}/120
            </small>
          </label>

          <label>
            Description

            <textarea
              maxLength={1000}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Explain what you're looking for."
              rows={5}
            />

            <small>
              {description.length}/1000
            </small>
          </label>

          <label>
            What type of referral do you need?

            <select
              value={needType}
              onChange={(event) =>
                setNeedType(
                  event.target.value as
                    | "new"
                    | "existing"
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
            <strong>
              1 listing per day
            </strong>

            <span>
              Each account can create one listing
              every 24 hours/day cycle. The limit is
              enforced by the database.
            </span>
          </div>

          <button
            className="primary formSubmit"
            disabled={
              submitting ||
              events.length === 0
            }
            type="submit"
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

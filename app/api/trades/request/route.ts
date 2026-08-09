import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth", request.url)
    );
  }

  const formData = await request.formData();

  const listingId = formData.get("listingId");

  if (typeof listingId !== "string") {
    return NextResponse.json(
      {
        error: "Invalid listing.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: listing, error: listingError } =
    await supabase
      .from("trade_listings")
      .select(
        `
        id,
        owner_id,
        status
      `
      )
      .eq("id", listingId)
      .single();

  if (listingError || !listing) {
    return NextResponse.json(
      {
        error: "Listing not found.",
      },
      {
        status: 404,
      }
    );
  }

  if (listing.owner_id === user.id) {
    return NextResponse.json(
      {
        error: "You cannot request your own listing.",
      },
      {
        status: 400,
      }
    );
  }

  if (listing.status !== "open") {
    return NextResponse.json(
      {
        error: "This listing is no longer open.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      listing_id: listing.id,
      requester_id: user.id,
      owner_id: listing.owner_id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 400,
      }
    );
  }

  await supabase
    .from("trade_listings")
    .update({
      status: "matched",
    })
    .eq("id", listing.id);

  return NextResponse.redirect(
    new URL(`/trades/${trade.id}`, request.url)
  );
}

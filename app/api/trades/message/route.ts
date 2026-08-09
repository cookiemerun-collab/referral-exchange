import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const tradeId = formData.get("tradeId");
  const body = formData.get("body");

  if (
    typeof tradeId !== "string" ||
    typeof body !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const message = body.trim();

  if (!message) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 }
    );
  }

  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 400 }
    );
  }

  const { data: trade, error: tradeError } =
    await supabase
      .from("trades")
      .select(
        `
          id,
          requester_id,
          owner_id,
          status
        `
      )
      .eq("id", tradeId)
      .single();

  if (tradeError || !trade) {
    return NextResponse.json(
      { error: "Trade not found." },
      { status: 404 }
    );
  }

  const isParticipant =
    trade.requester_id === user.id ||
    trade.owner_id === user.id;

  if (!isParticipant) {
    return NextResponse.json(
      { error: "You are not part of this trade." },
      { status: 403 }
    );
  }

  if (
    trade.status === "completed" ||
    trade.status === "cancelled"
  ) {
    return NextResponse.json(
      { error: "This trade is no longer active." },
      { status: 400 }
    );
  }

  const { error: messageError } = await supabase
    .from("trade_messages")
    .insert({
      trade_id: trade.id,
      sender_id: user.id,
      body: message,
    });

  if (messageError) {
    console.error(
      "Failed to create trade message:",
      messageError
    );

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL(`/trades/${trade.id}`, request.url)
  );
}

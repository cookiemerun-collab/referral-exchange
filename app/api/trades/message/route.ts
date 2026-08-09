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

  const tradeId = formData.get("tradeId");
  const body = formData.get("body");

  if (
    typeof tradeId !== "string" ||
    typeof body !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid message." },
      { status: 400 }
    );
  }

  const message = body.trim();

  if (!message || message.length > 1000) {
    return NextResponse.json(
      { error: "Invalid message length." },
      { status: 400 }
    );
  }

  const { data: trade } = await supabase
    .from("trades")
    .select("requester_id, owner_id, status")
    .eq("id", tradeId)
    .single();

  if (!trade) {
    return NextResponse.json(
      { error: "Trade not found." },
      { status: 404 }
    );
  }

  if (
    user.id !== trade.requester_id &&
    user.id !== trade.owner_id
  ) {
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 }
    );
  }

  if (
    trade.status === "cancelled" ||
    trade.status === "completed"
  ) {
    return NextResponse.json(
      { error: "This trade is closed." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("trade_messages")
    .insert({
      trade_id: tradeId,
      sender_id: user.id,
      body: message,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.redirect(
    new URL(`/trades/${tradeId}`, request.url)
  );
}

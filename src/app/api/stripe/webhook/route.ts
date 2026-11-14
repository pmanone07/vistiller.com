import type Stripe from "stripe";
import { getStripe, syncSubscription } from "@/server/billing";

/**
 * POST /api/stripe/webhook – Stripe tells us when a membership is paid,
 * renewed, cancelled or fails to renew.
 *
 * The request is only trusted after its signature has been verified with
 * STRIPE_WEBHOOK_SECRET, which needs the raw, unparsed body.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !process.env.STRIPE_SECRET_KEY?.trim()) {
    console.error("Stripe-webhook mottatt, men STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET er ikke satt.");
    return Response.json({ error: "Not configured" }, { status: 503 });
  }
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const subscription = event.data.object.subscription;
        if (subscription) await syncSubscription(typeof subscription === "string" ? subscription : subscription.id);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
      default:
        // Other event types are not needed; acknowledge so Stripe does not retry.
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry later, so a temporary database problem does not lose a payment.
    console.error(`Stripe-webhook ${event.type} (${event.id}) feilet:`, error);
    return Response.json({ error: "Temporary failure" }, { status: 500 });
  }

  return Response.json({ received: true });
}

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature using Stripe Node SDK if signature and secret are provided
    if (signature && webhookSecret) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        console.error(
          'Next.js Webhook Signature Verification Error:',
          err.message,
        );
        return NextResponse.json(
          { error: `Webhook Signature Verification Failed: ${err.message}` },
          { status: 400 },
        );
      }
    }

    // Forward raw request to Express Backend (port 5000) for MySQL DB updates and Notifications
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature || '',
      },
      body: rawBody,
    });

    const responseData = await res.json().catch(() => ({ received: true }));

    if (!res.ok) {
      return NextResponse.json(responseData, { status: res.status });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error('Next.js Stripe Webhook Route Exception:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.redirect(new URL('/dashboard/supporter/purchase-credit', req.url));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(
        new URL('/dashboard/supporter/purchase-credit?payment=failed', req.url),
      );
    }

    const { credits, email, name } = session.metadata!;

    await fetch('http://localhost:9000/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY!,
      },
      body: JSON.stringify({
        stripeSessionId: sessionId,
        credits: parseInt(credits),
        email,
        name,
        amountPaid: session.amount_total,
      }),
    });

    return NextResponse.redirect(
      new URL('/dashboard/supporter?payment=success', req.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL('/dashboard/supporter/purchase-credit?payment=error', req.url),
    );
  }
}

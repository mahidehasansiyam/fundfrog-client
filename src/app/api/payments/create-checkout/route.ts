import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { credits } = await req.json();
    const validPackages = [100, 300, 800, 1500];
    if (!validPackages.includes(credits)) {
      return NextResponse.json({ message: 'Invalid credit package.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${credits} Credits` },
            unit_amount: credits * 10,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/api/payments/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/supporter/purchase-credit?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

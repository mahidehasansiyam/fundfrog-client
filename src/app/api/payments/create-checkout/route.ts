import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

async function getCurrentUser(req: NextRequest) {
  const res = await fetch(`${API_URL}/api/auth/session`, {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user || null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Access denied. No token provided.' }, { status: 401 });
    }

    if (user.role !== 'supporter') {
      return NextResponse.json({ message: 'Access denied. Supporters only.' }, { status: 403 });
    }

    const { credits } = await req.json();
    const validPackages = [100, 300, 800, 1500];
    if (!validPackages.includes(credits)) {
      return NextResponse.json({ message: 'Invalid credit package.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
      client_reference_id: user.id,
      metadata: {
        credits: credits.toString(),
        email: user.email,
        name: user.name,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const JWT_SECRET = process.env.JWT_SECRET || 'fundfrog_jwt_secret_dev';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Access denied. No token provided.' }, { status: 401 });
    }

    let user: { id: string; email: string; name: string; role: string };
    try {
      user = jwt.verify(token, JWT_SECRET) as typeof user;
    } catch {
      return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
    }

    if (user.role !== 'supporter') {
      return NextResponse.json({ message: 'Access denied. Supporters only.' }, { status: 403 });
    }

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

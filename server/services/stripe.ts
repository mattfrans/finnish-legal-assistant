import Stripe from 'stripe';
import { env } from '../config';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'basic',
    priceId: env.STRIPE_BASIC_PRICE_ID,
    name: 'Basic',
    description: 'For personal use',
    priceEur: 9.99,
    features: ['Basic legal assistance', '50 queries per month'],
  },
  PRO: {
    id: 'pro',
    priceId: env.STRIPE_PRO_PRICE_ID,
    name: 'Professional',
    description: 'For professional use',
    priceEur: 29.99,
    features: ['Advanced legal assistance', 'Unlimited queries', 'Priority support'],
  },
};

export const stripeService = {
  async createCheckoutSession(userId: number, priceId: string) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card', 'klarna', 'mobilepay'],
        payment_method_options: {
          klarna: {
            preferred_locale: 'fi-FI',
          },
        },
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.CLIENT_URL}/payment/cancel`,
        customer_email: '', // TODO: Get from user profile
        metadata: {
          userId: userId.toString(),
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async createPortalSession(customerId: string) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${env.CLIENT_URL}/account`,
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  async handleWebhook(rawBody: string, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          // TODO: Update user's subscription status in database
          break;
        
        case 'customer.subscription.deleted':
          // TODO: Handle subscription cancellation
          break;

        case 'payment_intent.succeeded':
          // TODO: Handle successful payment
          break;

        case 'payment_intent.payment_failed':
          // TODO: Handle failed payment
          break;
      }

      return { received: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  },
};

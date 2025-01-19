import { Request, Response } from 'express';
import { stripeService, SUBSCRIPTION_TIERS } from '../services/stripe';

export const paymentController = {
  async getSubscriptionPlans(req: Request, res: Response) {
    try {
      res.json(Object.values(SUBSCRIPTION_TIERS));
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createCheckoutSession(req: Request, res: Response) {
    try {
      const { priceId } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const session = await stripeService.createCheckoutSession(userId, priceId);
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createPortalSession(req: Request, res: Response) {
    try {
      const { customerId } = req.body;
      const session = await stripeService.createPortalSession(customerId);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async handleWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const result = await stripeService.handleWebhook(req.rawBody, sig);
      res.json(result);
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  },
};

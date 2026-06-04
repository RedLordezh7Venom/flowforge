
import { Connector } from '../types';
export const StripeConnector: Connector = {
  config: { name: 'stripe', displayName: 'Stripe', description: 'Stripe payments', color: '#635BFF', authType: 'apiKey', baseUrl: 'https://api.stripe.com/v1' },
  operations: {
    createCustomer: { name: 'createCustomer', displayName: 'Create Customer', description: 'Create a Stripe customer', method: 'POST', path: '/customers' },
    createPaymentIntent: { name: 'createPaymentIntent', displayName: 'Create Payment Intent', description: 'Create a Stripe payment intent', method: 'POST', path: '/payment_intents' },
    listCharges: { name: 'listCharges', displayName: 'List Charges', description: 'List Stripe charges', method: 'GET', path: '/charges' },
  },
  execute: async (op, params, creds) => {
    const token = creds['secretKey'] as string;
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) body.append(k, String(v));
    const res = await fetch('https://api.stripe.com/v1/' + op, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    return res.json();
  },
};

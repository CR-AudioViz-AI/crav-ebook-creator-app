export type Plan = {
  id: 'free' | 'pro' | 'scale';
  name: string;
  monthly: number;
  features: string[];
  monthlyCredits: number;
  stripePriceId?: string;
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    monthlyCredits: Number(process.env.FREE_MONTHLY_CREDITS || 10000),
    features: ['Studio access', 'Mock LLM mode', 'Export to EPUB/PDF/DOCX'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 29,
    monthlyCredits: 150000,
    features: [
      'Faster models',
      'Priority queue',
      'Brand presets',
      'Advanced analytics',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTH,
  },
  {
    id: 'scale',
    name: 'Scale',
    monthly: 99,
    monthlyCredits: 750000,
    features: [
      'Team seats (5)',
      'Custom presets',
      'Priority support',
      'API access',
      'White-label exports',
    ],
    stripePriceId: process.env.STRIPE_PRICE_SCALE_MONTH,
  },
];

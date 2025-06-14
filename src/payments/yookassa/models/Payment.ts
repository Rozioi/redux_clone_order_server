import { z } from 'zod'
export const PaymentSchema = z.object({
  userId: z.string(),
  subscriptionId: z.string(), 
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string().default('RUB'),
  
  status: z.enum(['pending', 'waiting_for_capture', 'succeeded', 'canceled', 'refunded']), 
  confirmationUrl: z.string().url(), 
  
  description: z.string().optional(),
  createdAt: z.date(),
  
    raw: z.any().optional() 
  
})

export type YooKassaPaymentInput = z.infer<typeof PaymentSchema>;

export function transformYooKassaResponse(
  raw: any,
  userId: string,
  subscriptionId: string
): YooKassaPaymentInput {
  return {
    userId: userId,
    subscriptionId: subscriptionId,

    paymentId: raw.id,
    amount: parseFloat(raw.amount.value),
    currency: raw.amount.currency,

    status: raw.status,
    confirmationUrl: raw.confirmation?.confirmation_url || '',
    description: raw.description,
    createdAt: new Date(raw.created_at),

    raw 
  };
}

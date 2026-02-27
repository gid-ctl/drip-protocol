import { z } from "zod";

// Token type enum matching the config
export const tokenTypeSchema = z.enum(['STX', 'sBTC']);
export type TokenTypeValue = z.infer<typeof tokenTypeSchema>;

export const recipientSchema = z.object({
  recipientAddress: z
    .string()
    .min(1, "Recipient address is required")
    .regex(/^ST[A-Z0-9]{38,40}$/, "Enter a valid Stacks testnet address starting with ST"),
});

export const tokenSchema = z.object({
  tokenType: tokenTypeSchema.default('STX'),
});

export const amountSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Enter an amount greater than 0"),
    // Note: Max validation happens dynamically based on balance
});

export const durationSchema = z.object({
  durationDays: z
    .number({ invalid_type_error: "Enter a valid duration" })
    .int("Duration must be a whole number")
    .min(1, "Choose a duration between 1 and 365 days")
    .max(365, "Choose a duration between 1 and 365 days"),
});

export const createStreamSchema = recipientSchema
  .merge(tokenSchema)
  .merge(amountSchema)
  .merge(durationSchema);

export type RecipientFormValues = z.infer<typeof recipientSchema>;
export type TokenFormValues = z.infer<typeof tokenSchema>;
export type AmountFormValues = z.infer<typeof amountSchema>;
export type DurationFormValues = z.infer<typeof durationSchema>;
export type CreateStreamFormValues = z.infer<typeof createStreamSchema>;

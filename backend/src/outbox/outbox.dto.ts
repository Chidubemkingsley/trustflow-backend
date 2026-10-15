import { z } from 'zod';

export const CreateOutboxEventSchema = z.object({
  eventType: z.enum([
    'ESCROW_CREATED',
    'ESCROW_RELEASED',
    'DISPUTE_RAISED',
    'DISPUTE_RESOLVED',
    'EVIDENCE_SUBMITTED',
    'MILESTONE_APPROVED',
  ]),
  payload: z.string().min(1),
});

export type CreateOutboxEventDto = z.infer<typeof CreateOutboxEventSchema>;

export const BatchApproveMilestoneSchema = z.object({
  milestoneIds: z.array(z.string().min(1)).min(1).max(100),
  signerAddress: z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
});

export type BatchApproveMilestoneDto = z.infer<typeof BatchApproveMilestoneSchema>;

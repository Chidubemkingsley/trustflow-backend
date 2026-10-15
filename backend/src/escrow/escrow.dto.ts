import { z } from 'zod';

export const CreateEscrowSchema = z.object({
  depositor: z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
  beneficiary: z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
  amountXLM: z.string().regex(/^\d+(\.\d{1,7})?$/, 'Invalid XLM amount'),
  deadlineBlocks: z.number().int().positive().optional(),
});

export type CreateEscrowDto = z.infer<typeof CreateEscrowSchema>;

export const ReleaseEscrowSchema = z.object({
  escrowId: z.string().min(1),
  signerAddress: z.string().regex(/^G[A-Z2-7]{55}$/),
});

export type ReleaseEscrowDto = z.infer<typeof ReleaseEscrowSchema>;

export const BatchApproveMilestoneSchema = z.object({
  milestoneIds: z.array(z.string().min(1)).min(1).max(100),
  signerAddress: z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
});

export type BatchApproveMilestoneDto = z.infer<typeof BatchApproveMilestoneSchema>;

export interface BatchApproveResult {
  succeeded: Array<{ id: string; status: string }>;
  failed: Array<{ id: string; reason: string }>;
}

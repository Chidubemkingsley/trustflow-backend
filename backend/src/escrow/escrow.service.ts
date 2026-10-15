import { Injectable } from '@nestjs/common';

export interface Milestone {
  id: string;
  escrowId: string;
  title: string;
  amountXLM: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedAt?: string;
}

export interface Escrow {
  id: string;
  depositor: string;
  beneficiary: string;
  amountXLM: string;
  status: 'pending' | 'active' | 'released' | 'disputed';
  createdAt: string;
  disputeReason?: string;
  disputedAt?: string;
}

export interface BatchApproveResult {
  succeeded: Array<{ id: string; status: string }>;
  failed: Array<{ id: string; reason: string }>;
}

@Injectable()
export class EscrowService {
  private escrows: Map<string, Escrow> = new Map();
  private milestones = new Map<string, Milestone>();

  async create(depositor: string, beneficiary: string, amountXLM: string): Promise<Escrow> {
    const id = `esc-${Date.now()}`;
    const escrow: Escrow = {
      id,
      depositor,
      beneficiary,
      amountXLM,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.escrows.set(id, escrow);
    return escrow;
  }

  async findById(id: string): Promise<Escrow | undefined> {
    return this.escrows.get(id);
  }

  async findByDepositor(address: string): Promise<Escrow[]> {
    return [...this.escrows.values()].filter(e => e.depositor === address);
  }

  async release(id: string): Promise<Escrow> {
    const escrow = this.escrows.get(id);
    if (!escrow) throw new Error('Escrow not found');
    escrow.status = 'released';
    return escrow;
  }

  async raiseDispute(id: string, reason?: string): Promise<Escrow> {
    const escrow = this.escrows.get(id);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.status === 'released') throw new Error('Cannot dispute a released escrow');
    if (escrow.status === 'disputed') throw new Error('Escrow is already disputed');

    escrow.status = 'disputed';
    escrow.disputeReason = reason;
    escrow.disputedAt = new Date().toISOString();

    return escrow;
  }

  /**
   * Add a milestone to an escrow
   */
  async addMilestone(
    escrowId: string,
    title: string,
    amountXLM: string,
  ): Promise<Milestone> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error('Escrow not found');

    const id = `ms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const milestone: Milestone = {
      id,
      escrowId,
      title,
      amountXLM,
      status: 'pending',
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  /**
   * Get milestones for an escrow
   */
  async getMilestones(escrowId: string): Promise<Milestone[]> {
    return [...this.milestones.values()].filter(m => m.escrowId === escrowId);
  }

  /**
   * Approve a single milestone
   */
  async approveMilestone(id: string, signerAddress: string): Promise<Milestone> {
    const milestone = this.milestones.get(id);
    if (!milestone) throw new Error('Milestone not found');

    const escrow = this.escrows.get(milestone.escrowId);
    if (!escrow) throw new Error('Escrow not found');

    if (signerAddress !== escrow.depositor) {
      throw new Error('Only the depositor can approve milestones');
    }

    if (milestone.status !== 'pending') {
      throw new Error(`Milestone is already ${milestone.status}`);
    }

    milestone.status = 'approved';
    milestone.approver = signerAddress;
    milestone.approvedAt = new Date().toISOString();

    return milestone;
  }

  /**
   * Batch approve multiple milestones across different escrows
   */
  async batchApproveMilestones(
    milestoneIds: string[],
    signerAddress: string,
  ): Promise<BatchApproveResult> {
    const result: BatchApproveResult = { succeeded: [], failed: [] };

    for (const id of milestoneIds) {
      try {
        const milestone = await this.approveMilestone(id, signerAddress);
        result.succeeded.push({
          id: milestone.id,
          status: milestone.status,
        });
      } catch (error) {
        result.failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }
}

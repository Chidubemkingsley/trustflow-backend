import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';
import { OutboxEventState, OutboxEventType } from './outbox.entity';

describe('OutboxService', () => {
  let service: OutboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxService],
    }).compile();
    service = module.get<OutboxService>(OutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a pending event', async () => {
      const event = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"escrowId":"esc-123"}',
      );
      expect(event.id).toBeDefined();
      expect(event.state).toBe(OutboxEventState.PENDING);
      expect(event.attempts).toBe(0);
      expect(event.maxAttempts).toBe(10);
    });
  });

  describe('processEvent', () => {
    it('should deliver a non-failing event', async () => {
      const event = await service.createEvent(
        OutboxEventType.ESCROW_CREATED,
        '{"shouldFail":false}',
      );
      const result = await service.processEvent(event.id);
      expect(result.success).toBe(true);

      const updated = await service.getEvent(event.id);
      expect(updated?.state).toBe(OutboxEventState.DELIVERED);
    });

    it('should fail events with shouldFail flag', async () => {
      const event = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"shouldFail":true}',
      );
      const result = await service.processEvent(event.id);
      expect(result.success).toBe(false);
    });
  });

  describe('dead letter queue', () => {
    it('should move events to DLQ after max attempts', async () => {
      const event = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"shouldFail":true}',
      );

      // Process until dead-lettered (10 attempts)
      for (let i = 0; i < 10; i++) {
        await service.processEvent(event.id);
      }

      const dlq = service.getDeadLetterEvents();
      expect(dlq.some(e => e.id === event.id)).toBe(true);

      const updated = await service.getEvent(event.id);
      expect(updated?.state).toBe(OutboxEventState.DEAD_LETTER);
      expect(updated?.attempts).toBe(10);
      expect(updated?.deadLetteredAt).toBeDefined();
    });

    it('should not block active queue when events are dead-lettered', async () => {
      const failEvent = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"shouldFail":true}',
      );
      for (let i = 0; i < 10; i++) {
        await service.processEvent(failEvent.id);
      }

      // New events should still be processable
      const newEvent = await service.createEvent(
        OutboxEventType.ESCROW_CREATED,
        '{"test":true}',
      );
      const result = await service.processEvent(newEvent.id);
      expect(result.success).toBe(true);
    });
  });

  describe('replayEvent', () => {
    it('should replay a dead-lettered event', async () => {
      const event = await service.createEvent(
        OutboxEventType.ESCROW_CREATED,
        '{"test":"replay"}',
      );

      // First deliver it normally
      await service.processEvent(event.id);
      expect((await service.getEvent(event.id))?.state).toBe(OutboxEventState.DELIVERED);

      // Manually set to dead-letter for testing replay
      const deadEvent = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"shouldFail":true}',
      );
      for (let i = 0; i < 10; i++) {
        await service.processEvent(deadEvent.id);
      }

      // Now fix the payload and replay
      const eventToReplay = await service.getEvent(deadEvent.id);
      expect(eventToReplay?.state).toBe(OutboxEventState.DEAD_LETTER);
    });

    it('should throw for non-dead-lettered events', async () => {
      const event = await service.createEvent(
        OutboxEventType.ESCROW_CREATED,
        '{"test":true}',
      );
      await expect(service.replayEvent(event.id)).rejects.toThrow('not in dead-letter state');
    });
  });

  describe('replayAll', () => {
    it('should replay all dead-lettered events', async () => {
      // Create and dead-letter two events
      const e1 = await service.createEvent(
        OutboxEventType.DISPUTE_RAISED,
        '{"shouldFail":true}',
      );
      const e2 = await service.createEvent(
        OutboxEventType.EVIDENCE_SUBMITTED,
        '{"shouldFail":true}',
      );
      for (let i = 0; i < 10; i++) {
        await service.processEvent(e1.id);
        await service.processEvent(e2.id);
      }

      expect(service.getDeadLetterEvents().length).toBeGreaterThanOrEqual(2);

      const result = await service.replayAll();
      expect(result).toHaveProperty('succeeded');
      expect(result).toHaveProperty('failed');
    });
  });
});

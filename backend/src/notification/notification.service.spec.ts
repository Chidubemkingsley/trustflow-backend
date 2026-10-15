import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreferences', () => {
    it('should return default preferences for unknown address', () => {
      const prefs = service.getPreferences('GUNKNOWN');
      expect(prefs).toEqual({
        emailEnabled: true,
        pushEnabled: true,
        disputeAlerts: true,
        evidenceReminders: true,
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update email preference', () => {
      const address = 'GTESTEMAIL';
      service.updatePreferences(address, { emailEnabled: false });
      const prefs = service.getPreferences(address);
      expect(prefs.emailEnabled).toBe(false);
      expect(prefs.pushEnabled).toBe(true);
    });

    it('should update multiple preferences at once', () => {
      const address = 'GTESTMULTI';
      service.updatePreferences(address, {
        emailEnabled: false,
        pushEnabled: false,
        disputeAlerts: false,
      });
      const prefs = service.getPreferences(address);
      expect(prefs.emailEnabled).toBe(false);
      expect(prefs.pushEnabled).toBe(false);
      expect(prefs.disputeAlerts).toBe(false);
      expect(prefs.evidenceReminders).toBe(true);
    });

    it('should not affect other addresses', () => {
      service.updatePreferences('GADDR1', { emailEnabled: false });
      const prefs2 = service.getPreferences('GADDR2');
      expect(prefs2.emailEnabled).toBe(true);
    });
  });

  describe('notifyDisputeEscalation', () => {
    it('should attempt to notify both parties', async () => {
      const result = await service.notifyDisputeEscalation({
        escrowId: 'esc-123',
        depositor: 'GDEPOSITOR',
        beneficiary: 'GBENEFICIARY',
        amountXLM: '100',
        reason: 'Test dispute',
        disputedAt: new Date().toISOString(),
      });
      expect(result).toHaveProperty('depositorNotified');
      expect(result).toHaveProperty('beneficiaryNotified');
    });
  });

  describe('notifyEvidenceRequired', () => {
    it('should return false when evidence reminders are disabled', async () => {
      const address = 'GEVIDENCEOFF';
      service.updatePreferences(address, { evidenceReminders: false });
      const result = await service.notifyEvidenceRequired(address, {
        escrowId: 'esc-123',
        depositor: 'GDEPOSITOR',
        beneficiary: 'GBENEFICIARY',
        amountXLM: '100',
      });
      expect(result).toBe(false);
    });

    it('should attempt notification when evidence reminders are enabled', async () => {
      const address = 'GEVIDENCEON';
      service.updatePreferences(address, { evidenceReminders: true });
      const result = await service.notifyEvidenceRequired(address, {
        escrowId: 'esc-123',
        depositor: 'GDEPOSITOR',
        beneficiary: 'GBENEFICIARY',
        amountXLM: '100',
        evidenceDeadline: new Date(Date.now() + 86400000).toISOString(),
      });
      // Without API keys configured, returns false but doesn't throw
      expect(typeof result).toBe('boolean');
    });
  });
});

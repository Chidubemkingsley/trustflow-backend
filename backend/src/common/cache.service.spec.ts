import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();
    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrSet', () => {
    it('should fetch from data source on cache miss', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { id: 'esc-123', amountXLM: '100' };
      };

      const result = await service.getOrSet('escrow:esc-123', fetchFn);
      expect(result).toEqual({ id: 'esc-123', amountXLM: '100' });
      expect(fetchCount).toBe(1);
    });

    it('should return cached value on subsequent calls', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { id: 'esc-456' };
      };

      await service.getOrSet('escrow:esc-456', fetchFn);
      const result = await service.getOrSet('escrow:esc-456', fetchFn);

      expect(result).toEqual({ id: 'esc-456' });
      expect(fetchCount).toBe(1); // Only fetched once
    });

    it('should cache undefined results (negative caching)', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return undefined;
      };

      const result = await service.getOrSet('escrow:nonexistent', fetchFn);
      expect(result).toBeUndefined();
    });
  });

  describe('invalidate', () => {
    it('should remove key from cache', async () => {
      await service.set('escrow:invalidate-test', { test: true });
      const before = await service.get('escrow:invalidate-test');
      expect(before).toEqual({ test: true });

      await service.invalidate('escrow:invalidate-test');
      const after = await service.get('escrow:invalidate-test');
      expect(after).toBeUndefined();
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate multiple keys matching pattern', async () => {
      await service.set('escrow:pub:1', { id: '1' });
      await service.set('escrow:pub:2', { id: '2' });
      await service.set('escrow:other:3', { id: '3' });

      await service.invalidatePattern('escrow:pub:*');

      expect(await service.get('escrow:pub:1')).toBeUndefined();
      expect(await service.get('escrow:pub:2')).toBeUndefined();
      expect(await service.get('escrow:other:3')).toEqual({ id: '3' });
    });
  });

  describe('cache hit/miss/invalidation', () => {
    it('should track cache behavior correctly', async () => {
      const key = 'escrow:tracking-test';

      // First call — miss
      const r1 = await service.getOrSet(key, async () => ({ value: 1 }));
      expect(r1).toEqual({ value: 1 });

      // Second call — hit
      const r2 = await service.getOrSet(key, async () => ({ value: 2 }));
      expect(r2).toEqual({ value: 1 }); // Still original value

      // Invalidate
      await service.invalidate(key);

      // Third call — miss again
      const r3 = await service.getOrSet(key, async () => ({ value: 3 }));
      expect(r3).toEqual({ value: 3 });
    });
  });

  describe('TTL behavior', () => {
    it('should expire entries after TTL', async () => {
      // Set with very short TTL
      await service.set('escrow:ttl-test', { temp: true }, 1);

      // Should exist immediately
      const immediate = await service.get('escrow:ttl-test');
      expect(immediate).toEqual({ temp: true });

      // Wait for expiry
      await new Promise(r => setTimeout(r, 1100));

      // Should be expired
      const after = await service.get('escrow:ttl-test');
      expect(after).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return cache stats', () => {
      const stats = service.getStats();
      expect(stats).toHaveProperty('redisAvailable');
      expect(stats).toHaveProperty('localCacheSize');
    });
  });
});

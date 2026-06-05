import { describe, it, expect } from 'vitest';
import {
  CreateTeamSchema,
  CreateMemberSchema,
  WeighInSchema,
  KmLogSchema,
  LifestyleLogSchema,
  BenchmarkLogSchema,
  ImportAttendanceRowSchema,
  ImportKmRowSchema,
  ImportLifestyleRowSchema,
  ImportWeighInRowSchema,
  CreateBlockSchema
} from './schemas';

describe('Zod Schemas Validation', () => {
  describe('CreateTeamSchema', () => {
    it('should validate valid team names', () => {
      const result = CreateTeamSchema.safeParse({ name: 'Toa' });
      expect(result.success).toBe(true);
    });

    it('should reject names that are too short', () => {
      const result = CreateTeamSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const result = CreateTeamSchema.safeParse({ name: 'A'.repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateMemberSchema & UpdateMemberSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate a correct member definition', () => {
      const result = CreateMemberSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        teamId: validUuid
      });
      expect(result.success).toBe(true);
    });

    it('should allow optional or empty teamId', () => {
      const result1 = CreateMemberSchema.safeParse({ firstName: 'John', lastName: 'Doe' });
      const result2 = CreateMemberSchema.safeParse({ firstName: 'John', lastName: 'Doe', teamId: '' });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should reject missing names', () => {
      const result = CreateMemberSchema.safeParse({ firstName: '', lastName: 'Doe' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid teamId uuid', () => {
      const result = CreateMemberSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        teamId: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('WeighInSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correct weigh-ins', () => {
      const result = WeighInSchema.safeParse({
        memberId: validUuid,
        weight: 85.5,
        date: '2026-06-05'
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const result = WeighInSchema.safeParse({
        memberId: validUuid,
        weight: -1,
        date: '2026-06-05'
      });
      expect(result.success).toBe(false);
    });

    it('should reject excessive weight', () => {
      const result = WeighInSchema.safeParse({
        memberId: validUuid,
        weight: 501,
        date: '2026-06-05'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('KmLogSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correct KM logs', () => {
      const result = KmLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        totalKm: 42.2
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative km values', () => {
      const result = KmLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        totalKm: -0.1
      });
      expect(result.success).toBe(false);
    });

    it('should reject excessive km values', () => {
      const result = KmLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        totalKm: 201
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LifestyleLogSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correct lifestyle logs', () => {
      const result = LifestyleLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        postCount: 5
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative post count', () => {
      const result = LifestyleLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        postCount: -1
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer post count', () => {
      const result = LifestyleLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        postCount: 3.5
      });
      expect(result.success).toBe(false);
    });
  });

  describe('BenchmarkLogSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correct benchmark logs', () => {
      const result = BenchmarkLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        date: '2026-06-05',
        squats: 50,
        pushups: 40,
        burpees: 30
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const result = BenchmarkLogSchema.safeParse({
        memberId: validUuid,
        blockWeekId: validUuid,
        date: '2026-06-05',
        squats: -5,
        pushups: 40,
        burpees: 30
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CSV Import Row Schemas', () => {
    describe('ImportAttendanceRowSchema', () => {
      it('should transform present/absent to boolean', () => {
        expect(ImportAttendanceRowSchema.parse('present')).toBe(true);
        expect(ImportAttendanceRowSchema.parse('absent')).toBe(false);
        expect(ImportAttendanceRowSchema.parse('PRESENT ')).toBe(true);
      });

      it('should transform - and empty to null', () => {
        expect(ImportAttendanceRowSchema.parse('-')).toBeNull();
        expect(ImportAttendanceRowSchema.parse('')).toBeNull();
      });

      it('should reject invalid strings', () => {
        const result = ImportAttendanceRowSchema.safeParse('maybe');
        expect(result.success).toBe(false);
      });
    });

    describe('ImportKmRowSchema', () => {
      it('should parse valid km strings', () => {
        expect(ImportKmRowSchema.parse('15.5')).toBe(15.5);
        expect(ImportKmRowSchema.parse('0')).toBe(0);
      });

      it('should reject negative values', () => {
        const result = ImportKmRowSchema.safeParse('-10.2');
        expect(result.success).toBe(false);
      });

      it('should reject non-numeric values', () => {
        const result = ImportKmRowSchema.safeParse('abc');
        expect(result.success).toBe(false);
      });
    });

    describe('ImportLifestyleRowSchema', () => {
      it('should parse valid whole number strings', () => {
        expect(ImportLifestyleRowSchema.parse('7')).toBe(7);
        expect(ImportLifestyleRowSchema.parse('0')).toBe(0);
      });

      it('should reject non-integer strings', () => {
        const result = ImportLifestyleRowSchema.safeParse('5.5');
        expect(result.success).toBe(false);
      });

      it('should reject negative numbers', () => {
        const result = ImportLifestyleRowSchema.safeParse('-1');
        expect(result.success).toBe(false);
      });
    });

    describe('ImportWeighInRowSchema', () => {
      it('should parse valid weights', () => {
        expect(ImportWeighInRowSchema.parse('92.3')).toBe(92.3);
      });

      it('should reject excessive values', () => {
        const result = ImportWeighInRowSchema.safeParse('550');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('CreateBlockSchema', () => {
    it('should validate a correct block definition', () => {
      const result = CreateBlockSchema.safeParse({
        name: 'Block 1',
        startDate: '2026-06-05',
        numberOfWeeks: 6
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid dates', () => {
      const result = CreateBlockSchema.safeParse({
        name: 'Block 1',
        startDate: '2026/06/05',
        numberOfWeeks: 6
      });
      expect(result.success).toBe(false);
    });

    it('should reject out-of-bounds week counts', () => {
      const resultLow = CreateBlockSchema.safeParse({
        name: 'Block 1',
        startDate: '2026-06-05',
        numberOfWeeks: 0
      });
      const resultHigh = CreateBlockSchema.safeParse({
        name: 'Block 1',
        startDate: '2026-06-05',
        numberOfWeeks: 21
      });
      expect(resultLow.success).toBe(false);
      expect(resultHigh.success).toBe(false);
    });
  });
});

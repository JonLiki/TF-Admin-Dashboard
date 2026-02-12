
import { describe, it, expect } from 'vitest';
import {
    ImportAttendanceRowSchema,
    ImportKmRowSchema,
    ImportLifestyleRowSchema,
    ImportWeighInRowSchema
} from '@/lib/schemas';

describe('Import Validation Schemas', () => {

    describe('Attendance Schema', () => {
        it('should accept "Present" and "Absent" (case insensitive)', () => {
            expect(ImportAttendanceRowSchema.parse('Present')).toBe(true);
            expect(ImportAttendanceRowSchema.parse('absent')).toBe(false);
            expect(ImportAttendanceRowSchema.parse('PRESENT')).toBe(true);
        });

        it('should ignore empty or dash', () => {
            expect(ImportAttendanceRowSchema.parse('-')).toBe(null);
            expect(ImportAttendanceRowSchema.parse('')).toBe(null);
        });

        it('should reject invalid values', () => {
            expect(() => ImportAttendanceRowSchema.parse('Maybe')).toThrow();
            expect(() => ImportAttendanceRowSchema.parse('123')).toThrow();
        });
    });

    describe('KM Schema', () => {
        it('should accept positive numbers', () => {
            expect(ImportKmRowSchema.parse('5.5')).toBe(5.5);
            expect(ImportKmRowSchema.parse('10')).toBe(10);
        });

        it('should reject negative numbers', () => {
            expect(() => ImportKmRowSchema.parse('-5')).toThrow();
        });

        it('should reject text', () => {
            expect(() => ImportKmRowSchema.parse('five')).toThrow();
        });
    });

    describe('Lifestyle Schema', () => {
        it('should accept integers 0-7', () => {
            expect(ImportLifestyleRowSchema.parse('0')).toBe(0);
            expect(ImportLifestyleRowSchema.parse('7')).toBe(7);
        });

        it('should reject numbers > 7', () => {
            expect(() => ImportLifestyleRowSchema.parse('8')).toThrow();
        });

        it('should reject decimals', () => {
            expect(() => ImportLifestyleRowSchema.parse('3.5')).toThrow();
        });
    });

    describe('Weigh-In Schema', () => {
        it('should accept valid weights', () => {
            expect(ImportWeighInRowSchema.parse('100.5')).toBe(100.5);
        });

        it('should reject unrealistic weights', () => {
            expect(() => ImportWeighInRowSchema.parse('10')).toThrow(); // Too low
            expect(() => ImportWeighInRowSchema.parse('400')).toThrow(); // Too high
        });
    });
});

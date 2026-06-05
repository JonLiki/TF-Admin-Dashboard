import { describe, it, expect } from 'vitest';
import { parseCSV } from './csvParser';

describe('parseCSV', () => {
  it('should parse simple CSV data', () => {
    const csv = 'First,Last,Role\nJohn,Doe,Participant\nJane,Smith,Admin';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['First', 'Last', 'Role'],
      ['John', 'Doe', 'Participant'],
      ['Jane', 'Smith', 'Admin']
    ]);
  });

  it('should handle carriage returns and newlines', () => {
    const csv = 'First,Last\r\nJohn,Doe\nJane,Smith\r\n';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['First', 'Last'],
      ['John', 'Doe'],
      ['Jane', 'Smith']
    ]);
  });

  it('should handle cells with commas enclosed in double quotes', () => {
    const csv = 'Name,Quote\n"Doe, John","Hello, World!"\n"Smith, Jane","Simple"';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['Name', 'Quote'],
      ['Doe, John', 'Hello, World!'],
      ['Smith, Jane', 'Simple']
    ]);
  });

  it('should handle escaped quotes inside quotes', () => {
    const csv = 'Name,Text\n"John ""Danger"" Doe","I said ""hello"""';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['Name', 'Text'],
      ['John "Danger" Doe', 'I said "hello"']
    ]);
  });

  it('should handle cell content with newlines inside quotes', () => {
    const csv = 'Id,Note\n1,"Line 1\nLine 2"\n2,"Simple note"';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['Id', 'Note'],
      ['1', 'Line 1\nLine 2'],
      ['2', 'Simple note']
    ]);
  });

  it('should trim whitespace from non-quoted cell values', () => {
    const csv = '  John  ,  Doe  \n  Jane  ,  Smith  ';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['John', 'Doe'],
      ['Jane', 'Smith']
    ]);
  });

  it('should handle empty rows and cells', () => {
    const csv = 'First,,Last\n,,';
    const parsed = parseCSV(csv);
    expect(parsed).toEqual([
      ['First', '', 'Last'],
      ['', '', '']
    ]);
  });
});

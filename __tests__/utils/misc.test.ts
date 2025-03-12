import {
  camelCaseKeys,
  deduplicateOptions,
  orderedList,
  safeJSONParse,
  tryParseDate,
} from '../../utils/misc';

describe('camelCaseKeys', () => {
  test('should convert snake_case keys to camelCase', () => {
    const input = {
      first_name: 'John',
      last_name: 'Doe',
      contact_info: {
        phone_number: '123-456-7890',
        email_address: 'john@example.com',
      },
    };
    const expected = {
      firstName: 'John',
      lastName: 'Doe',
      contactInfo: {
        phoneNumber: '123-456-7890',
        emailAddress: 'john@example.com',
      },
    };
    expect(camelCaseKeys(input)).toEqual(expected);
  });

  test('should handle arrays of objects', () => {
    const input = [
      { user_id: 1, first_name: 'John' },
      { user_id: 2, first_name: 'Jane' },
    ];
    const expected = [
      { userId: 1, firstName: 'John' },
      { userId: 2, firstName: 'Jane' },
    ];
    expect(camelCaseKeys(input)).toEqual(expected);
  });

  test('should return primitive values as is', () => {
    // @ts-expect-error passing null on purpose
    expect(camelCaseKeys(null)).toBeNull();
    // @ts-expect-error passing a string on purpose
    expect(camelCaseKeys('string')).toBe('string');
    // @ts-expect-error passing a number on purpose
    expect(camelCaseKeys(123)).toBe(123);
  });

  test('should handle undefined and empty objects', () => {
    expect(camelCaseKeys(undefined as any)).toBeUndefined();
    expect(camelCaseKeys({})).toEqual({});
  });

  test('should handle objects with non-string keys', () => {
    const input = {
      123: 'numeric key',
      [Symbol('test')]: 'symbol key',
      normal_key: 'string key',
    };
    const result = camelCaseKeys(input);
    expect(result).toHaveProperty('123');
    expect(result).toHaveProperty('normalKey');
  });

  test('should handle circular references gracefully', () => {
    const circular: any = { key: 'value' };
    circular.self = circular;
    expect(() => camelCaseKeys(circular)).not.toThrow();
  });
});

describe('deduplicateOptions', () => {
  test('should remove duplicate options based on value', () => {
    const input = [
      { label: 'Option 1', value: 'value1' },
      { label: 'Option 2', value: 'value2' },
      { label: 'Option 1 Duplicate', value: 'value1' },
      { label: 'Option 3', value: 'value3' },
    ];
    const expected = [
      { label: 'Option 1', value: 'value1' },
      { label: 'Option 2', value: 'value2' },
      { label: 'Option 3', value: 'value3' },
    ];
    expect(deduplicateOptions(input)).toEqual(expected);
  });

  test('should handle empty array', () => {
    expect(deduplicateOptions([])).toEqual([]);
  });

  test('should handle malformed option objects', () => {
    const input = [
      { label: 'Valid', value: 'valid' },
      { value: 'no-label' } as any,
      { label: 'No Value' } as any,
      null as any,
      undefined as any,
    ];
    const result = deduplicateOptions(input);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ label: 'Valid', value: 'valid' });
    expect(result[1]).toEqual({ value: 'no-label' });
    expect(result[2]).toEqual({ label: 'No Value' });
  });

  test('should handle non-array inputs', () => {
    expect(() => deduplicateOptions(null as any)).toThrow();
    expect(() => deduplicateOptions(undefined as any)).toThrow();
    expect(() => deduplicateOptions({} as any)).toThrow();
  });
});

describe('safeJSONParse', () => {
  test('should parse valid JSON string', () => {
    const input = '{"name": "John", "age": 30}';
    const expected = { name: 'John', age: 30 };
    expect(safeJSONParse(input, {})).toEqual(expected);
  });

  test('should return default value for invalid JSON', () => {
    const defaultValue = { error: true };
    expect(safeJSONParse('invalid json', defaultValue)).toEqual(defaultValue);
  });

  test('should return input if it matches default value type', () => {
    const input = { name: 'John' };
    expect(safeJSONParse(input, {})).toEqual(input);
  });

  test('should handle undefined and null inputs', () => {
    const defaultValue = { default: true };
    expect(safeJSONParse(undefined, defaultValue)).toEqual(defaultValue);
    expect(safeJSONParse(null, defaultValue)).toEqual(defaultValue);
  });

  test('should handle non-string non-object inputs', () => {
    const defaultValue = { default: true };
    expect(safeJSONParse(123, defaultValue)).toEqual(defaultValue);
    expect(safeJSONParse(true, defaultValue)).toEqual(defaultValue);
    expect(safeJSONParse([], defaultValue)).toEqual(defaultValue);
  });

  test('should handle malformed JSON strings', () => {
    const defaultValue = { default: true };
    expect(safeJSONParse('{invalid:json}', defaultValue)).toEqual(defaultValue);
    expect(safeJSONParse('{"unclosed": "bracket"', defaultValue)).toEqual(defaultValue);
  });
});

describe('tryParseDate', () => {
  test('should parse valid date string', () => {
    const dateStr = '2025-01-28T16:45:24';
    const result = tryParseDate(dateStr);
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toContain('2025-01-28');
  });

  test('should handle Date object input', () => {
    const date = new Date('2025-01-28');
    const result = tryParseDate(date);
    expect(result).toEqual(date);
  });

  test('should return default date when parsing fails', () => {
    const defaultDate = new Date('2025-01-01');
    const result = tryParseDate('invalid date', defaultDate);
    expect(result).toEqual(defaultDate);
  });

  test('should handle invalid date inputs', () => {
    expect(() => tryParseDate('not a date')).toThrow();
    expect(() => tryParseDate({})).toThrow();
    expect(() => tryParseDate([])).toThrow();
    expect(() => tryParseDate(null)).toThrow();
    expect(() => tryParseDate(undefined)).toThrow();
  });

  test('should handle invalid numeric timestamps', () => {
    const defaultDate = new Date();
    expect(tryParseDate(NaN, defaultDate)).toEqual(defaultDate);
    expect(tryParseDate(Infinity, defaultDate)).toEqual(defaultDate);
    expect(tryParseDate(-Infinity, defaultDate)).toEqual(defaultDate);
  });

  test('should handle various date string formats', () => {
    expect(tryParseDate('2025-01-28')).toBeInstanceOf(Date);
    expect(tryParseDate('01/28/2025')).toBeInstanceOf(Date);
    expect(tryParseDate('Jan 28, 2025')).toBeInstanceOf(Date);
    expect(() => tryParseDate('32/13/2025')).toThrow();
  });
});

describe('orderedList', () => {
  test('should reorder list based on specified order', () => {
    const list1 = ['apple', 'banana', 'orange', 'grape'];
    const list2 = ['orange', '_', 'apple', 'grape'];
    const expected = ['orange', 'apple', 'grape', 'banana'];
    expect(orderedList(list1, list2)).toEqual(expected);
  });

  test('should handle items not present in ordering list', () => {
    const list1 = ['apple', 'banana', 'orange'];
    const list2 = ['banana'];
    const expected = ['banana', 'apple', 'orange'];
    expect(orderedList(list1, list2)).toEqual(expected);
  });

  test('should handle empty ordering list', () => {
    const list1 = ['apple', 'banana'];
    const list2: string[] = [];
    expect(orderedList(list1, list2)).toEqual(list1);
  });

  test('should handle null or undefined inputs', () => {
    expect(orderedList(null as any, [])).toEqual([]);
    expect(orderedList(undefined as any, [])).toEqual([]);
    expect(orderedList([], null as any)).toEqual([]);
    expect(orderedList([], undefined as any)).toEqual([]);
  });

  test('should handle non-string array elements', () => {
    const list1 = ['valid', null as any, undefined as any, 123 as any];
    const list2 = ['valid', '_', '123'];
    const result = orderedList(list1, list2);
    expect(result).toEqual(['valid', 123]);
  });

  test('should handle duplicate values in input lists', () => {
    const list1 = ['apple', 'apple', 'banana'];
    const list2 = ['banana', 'apple'];
    const expected = ['banana', 'apple', 'apple'];
    expect(orderedList(list1, list2)).toEqual(expected);
  });
});

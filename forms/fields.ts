import { field } from './utils';

/**
 * Description of a field that accepts a file as input
 * @param opts
 * @returns
 */
export const descFileField = function (
  opts: {
    name?: string;
    description?: string;
    allowMultiple?: boolean;
  } = {}
) {
  let multiple = opts.allowMultiple;
  const [minItems, maxItems] = [1, 1];

  if (multiple) {
    if (!(minItems <= maxItems)) {
      throw new Error('invalid component types. `min` can not be greater than `max`.');
    }
  }

  return field({
    name: opts.name ?? '',
    description: opts.description ?? '',
    required: true,
    fieldType: 'file',
    inputType: 'file',
    allowedMimeTypes: ['images/png', 'images/jpeg'] as const,
    multiple: opts?.allowMultiple ?? true,
    minItems: minItems,
    maxItems: maxItems,
  });
};

export type FileField = ReturnType<typeof descFileField>;

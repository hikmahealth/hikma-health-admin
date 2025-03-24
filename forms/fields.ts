import { withRequiredFields } from './utils';

const MIME_IMAGE_TYPES = ['image/png', 'image/jpeg'] as const;
const MIME_DOCUMENT_TYPES = ['application/pdf'] as const;

const ALL_MIME_TYPES = [...MIME_IMAGE_TYPES, ...MIME_DOCUMENT_TYPES];
type SupportedMIMEType = (typeof ALL_MIME_TYPES)[number];

/**
 * Description of a field that accepts a file as input
 * @param opts
 * @returns
 */
export const fieldFile = function (
  opts: Partial<
    {
      name: string;
      description: string;
      fileType: 'image' | 'documents' | 'all';
    } & (
      | {
          allowMultiple: false;
        }
      | { allowMultiple: true; max: number; min: number }
    )
  > = {}
) {
  let [minItems, maxItems] = [1, 1];

  if (opts.allowMultiple) {
    [minItems, maxItems] = [opts.min ?? 1, opts.max ?? 1];
    if (!(minItems <= maxItems)) {
      throw new Error('invalid component types. `min` can not be greater than `max`.');
    }
  }

  let allowedMimeTypes: SupportedMIMEType[] | null = null;
  if (opts.fileType) {
    if (opts.fileType === 'image') {
      // @ts-ignore readonly array
      allowedMimeTypes = MIME_IMAGE_TYPES;
    }

    if (opts.fileType === 'documents') {
      // @ts-ignore readonly array
      allowedMimeTypes = MIME_DOCUMENT_TYPES;
    }

    if (opts.fileType === 'all') {
      allowedMimeTypes = ALL_MIME_TYPES;
    }
  }

  // NOTE: depending on how this goes, we might as well just have `zod`.
  //  I think it's a good ideal to ensure the types can be validated on a JS level,
  //
  // Optionally, You can use information from `InputType` and `FieldType`
  return withRequiredFields<{ fieldType: 'file' | 'image'; inputType: 'file' }>()({
    name: opts.name ?? '',
    description: opts.description ?? '',
    required: true,
    fieldType: 'file',
    inputType: 'file',
    allowedMimeTypes: allowedMimeTypes,
    multiple: opts?.allowMultiple ?? true,
    minItems: minItems,
    maxItems: maxItems,
  });
};

export type FileField = ReturnType<typeof fieldFile>;

import { IconBox } from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import React from 'react';

/**
 * Describing the fields the are required when
 * defining the filed
 */
export type RequiredFieldDescription = {
  id: string;
  fieldType: string;
  inputType: string;
  name: string;
  description: string;
  required: boolean;
};

// As the name suggest, makes the intered types look nice
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const withRequiredFields = <R extends Record<string, any> & { id?: string }>() =>
  function <D extends Optional<Required<R> & Omit<RequiredFieldDescription, keyof R>, 'id'>>(
    description: D
  ) {
    if (!('id' in description) || typeof description['id'] !== 'string') {
      description['id'] = nanoid() as R['id'] & string;
    }

    return description as Prettify<{ id: R['id'] & string } & typeof description>;
  };

export const field = withRequiredFields();

export const createComponent = function <
  FieldDescription extends ReturnType<typeof field<RequiredFieldDescription>>,
>(
  instance: FieldDescription,
  opts: {
    label: string;
    icon?: React.ReactNode;
    render: React.FC<{ field: FieldDescription }>;
  }
) {
  if (!opts.render) {
    throw new Error('missing `opts.render` please define or move component');
  }

  return {
    key: instance.fieldType,
    button: {
      label: opts.label ?? instance.fieldType,
      // NOTE: might move this default definition out
      icon: opts.icon ?? <IconBox />,
    },
    instance,
    ...opts,
  };
};

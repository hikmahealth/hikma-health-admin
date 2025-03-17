import { IconBox } from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import React from 'react';

/**
 * Basic description of a form field
 */
type BaseFieldDescription<TField, TInput> = {
  fieldType: TField;
  inputType: TInput;
  id: string;
  name: string;
  description: string;
  required: boolean;
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const field = function <
  B extends BaseFieldDescription<string, string>,
  V extends Optional<B, 'id'> & Record<string, any> = B,
>(description: V) {
  if (!('id' in description) || typeof description['id'] !== 'string') {
    description['id'] = nanoid();
  }

  return description as Prettify<{ id: string } & typeof description>;
};

export const createComponent = function <
  FieldDescription extends ReturnType<typeof field<BaseFieldDescription<string, string>>>,
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
      icon: opts.icon ?? <IconBox />,
    },
    instance,
    ...opts,
  };
};

import { HHField, HHFieldWithPosition } from '@/types/Inputs';
import { Group, MultiSelect, Radio, Select } from '@mantine/core';
import { eq } from 'lodash';
import React from 'react';

export const OptionsInput = React.memo(
  ({ field }: { field: HHFieldWithPosition | HHField }) => {
    const inputProps = {
      // @ts-expect-error
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      // @ts-expect-error
      multi: field.multi,
      // value: field.value,
    };

    switch (field.inputType) {
      case 'radio':
        return (
          // @ts-expect-error
          <Radio.Group name={field.name} {...inputProps} field={field}>
            <Group mt="xs">
              {field.options.map((option) => (
                <Radio key={option.value} value={option.value} label={option.label} />
              ))}
            </Group>
          </Radio.Group>
        );
      case 'select':
      default:
        // @ts-expect-error
        if (field.multi) {
          return (
            <MultiSelect
              // @ts-expect-error
              data={field.options}
              // @ts-expect-error
              multiple={field.multi}
              {...inputProps}
              // @ts-expect-error
              field={field}
            />
          );
        } else {
          return (
            // @ts-expect-error
            <Select data={field.options} multiple={field.multi} {...inputProps} field={field} />
          );
        }
    }
  },
  (pres, next) => eq(pres.field, next.field)
);

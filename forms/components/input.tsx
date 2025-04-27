import { HHField, HHFieldWithPosition } from '@/types/Inputs';
import { Group, MultiSelect, Radio, Select } from '@mantine/core';
import { eq } from 'lodash';
import React from 'react';

export const OptionsInput = React.memo(
  ({ field }: { field: HHFieldWithPosition | HHField }) => {
    const inputProps = {
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      multi: field.multi,
      // value: field.value,
    };

    switch (field.inputType) {
      case 'radio':
        return (
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
        if (field.multi) {
          return (
            <MultiSelect
              data={field.options}
              multiple={field.multi}
              {...inputProps}
              field={field}
            />
          );
        } else {
          return (
            <Select data={field.options} multiple={field.multi} {...inputProps} field={field} />
          );
        }
    }
  },
  (pres, next) => eq(pres.field, next.field)
);

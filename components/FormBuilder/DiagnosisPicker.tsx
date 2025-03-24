import { MultiSelect } from '@mantine/core';
import { useState } from 'react';
import icd11 from '../../data/icd11-xs.js'; // Importing the extra small ICD10 JSON file
import { HHField, HHFieldWithPosition } from '../../types/Inputs';

type Props = {
  field: HHFieldWithPosition | HHField;
};

export function DiagnosisSelect({ field }: Props) {
  const [data, setData] = useState(
    icd11.map((item) => ({
      value: `${item.desc} (${item.code})`,
      label: `${item.desc} (${item.code})`,
    }))
  );

  // FIXME: Need to replace the diagnosis picker with new select item from `react-select` with better creatable support
  return (
    <MultiSelect
      label={field.name}
      description={field.description}
      data={data}
      required={field.required}
      placeholder="Select items"
      searchable
      maxDropdownHeight={160}
      limit={20}
      // getCreateLabel={(query) => `+ Add ${query}`}
      // onCreate={(query) => {
      // const item = { value: query, label: query };
      // setData((current) => [...current, item]);
      // return item;
      // }}
    />
  );
}

import { IconPlus } from '@tabler/icons-react';

type FABProps = {
  onClick: () => void;
};

export const FAB = (props: FABProps) => {
  return (
    <div
      onClick={props.onClick}
      className="fixed bottom-4 right-4 cursor-pointer items-center flex justify-center m-4 w-14 h-14 rounded-full bg-blue-600 shadow-md hover:shadow-xl"
    >
      <IconPlus size="1.5rem" />
    </div>
  );
};

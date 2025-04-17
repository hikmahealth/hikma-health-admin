import { IconBox, IconHome } from '@tabler/icons-react';
import { useMemo } from 'react';

const baseNavigationList = [
  {
    key: 'general',
    name: 'General',
    href: '/app/settings',
    icon: IconHome,
  },
  {
    key: 'storage',
    name: 'Storage Configuration',
    href: '/app/settings/storage',
    icon: IconBox,
    isNew: true,
  },
];

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings(props: { children: React.ReactNode; navKey: string }) {
  const navigation = useMemo(() => {
    // appends `current: boolean`
    return baseNavigationList.map((n) => ({ ...n, current: props.navKey === n.key }));
  }, [props.navKey]);

  return (
    <div className="mx-auto max-w-7xl lg:flex lg:gap-x-16 lg:px-8">
      {/* <aside className="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-20">
        <nav className="flex-none px-4 sm:px-6 lg:px-0">
          <ul role="list" className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-50 text-gray-600'
                      : 'text-white hover:bg-gray-50/20 hover:text-gray-300',
                    'group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm/6 font-semibold'
                  )}
                >
                  <item.icon
                    aria-hidden="true"
                    className={classNames(
                      item.current ? 'text-gray-600' : 'text-gray-300 group-hover:text-gray-400',
                      'size-6 shrink-0'
                    )}
                  />
                  {item.name}
                  {item.isNew && (
                    <span
                      className={classNames(
                        'text-xs px-1 py-[2px] inline-flex flex-col items-center justify-center rounded-lg border -ml-2',
                        'bg-green-400 text-green-800 border-transparent'
                      )}
                    >
                      New
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside> */}
      {props.children}
    </div>
  );
}

Settings.Body = function (props: { children: React.ReactNode; className?: string }) {
  return (
    <main className="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-20 text-gray-100 border-gray-100">
      <div
        className={classNames(
          'mx-auto max-w-2xl space-y-6 sm:space-y-8 lg:mx-0 lg:max-w-none',
          props?.className
        )}
      >
        {props.children}
      </div>
    </main>
  );
};

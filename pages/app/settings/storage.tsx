import { IconFingerprint, IconUser } from '@tabler/icons-react';
import AppLayout from '../../../components/Layout';
import Settings from '../../../components/settings/Layout';

const secondaryNavigation = [
  { name: 'Profile', href: '#', icon: IconFingerprint, current: false },
  { name: 'Storage Configuration', href: '#', icon: IconUser, current: true, isNew: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GeneralSettingsPage() {
  return (
    <AppLayout title={'Settings'}>
      <Settings navKey="storage">
        <Settings.Body>
          <div>
            <h2 className="font-semibold text-xl text-gray-400">Storage Configuration</h2>
            <p className="mt-1 text-sm/6 text-gray-300">
              You are now able to attach your own storage. Currently supporting only S3 (AWS or
              Tigris Data) and GCP Cloud Storage options
            </p>
          </div>
          <main>{/* include the details of the storage */}</main>
        </Settings.Body>
      </Settings>
    </AppLayout>
  );
}

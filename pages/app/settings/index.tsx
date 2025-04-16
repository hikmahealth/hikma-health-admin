import AppLayout from '../../../components/Layout';
import Settings from '../../../components/settings/Layout';

export default function GeneralSettingsPage() {
  return (
    <AppLayout title={'Settings'}>
      <Settings navKey="general">
        <Settings.Body>
          <div>
            <h2 className="font-semibold text-xl text-gray-400">General</h2>
            <p className="mt-1 text-sm/6 text-gray-300">
              Here are the general setting set up on your `hikma-health` instance.
            </p>
          </div>
          <div className="divide-y border-t border-gray-700 divide-gray-700 w-full">
            <div className="w-full gap-2 flex flex-col py-4">
              <p>
                Your <pre className="inline-block whitespace-nowrap">`hikma-health`</pre> instance
                servicing from:
              </p>
              <code className="font-medium py-3 flex-1 px-2 text-sm rounded-md bg-black/20 bg-multiply">
                {process.env.NEXT_PUBLIC_HIKMA_API}
              </code>
            </div>
          </div>
        </Settings.Body>
      </Settings>
    </AppLayout>
  );
}

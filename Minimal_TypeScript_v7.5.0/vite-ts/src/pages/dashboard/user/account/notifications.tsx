import { CONFIG } from 'src/global-config';

import { AccountNotificationsView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Account notifications settings | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccountNotificationsView />
    </>
  );
}

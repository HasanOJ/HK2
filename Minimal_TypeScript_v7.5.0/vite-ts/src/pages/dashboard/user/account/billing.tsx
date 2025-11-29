import { CONFIG } from 'src/global-config';

import { AccountBillingView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Account billing settings | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccountBillingView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { AccountSocialsView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Account socials settings | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccountSocialsView />
    </>
  );
}

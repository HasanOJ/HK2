import { CONFIG } from 'src/global-config';

import { MailView } from 'src/sections/mail/view';

// ----------------------------------------------------------------------

const metadata = { title: `Mail | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MailView />
    </>
  );
}

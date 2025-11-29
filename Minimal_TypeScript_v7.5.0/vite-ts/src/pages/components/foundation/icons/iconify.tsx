import { CONFIG } from 'src/global-config';

import { IconifyView } from 'src/sections/_examples/foundation/icons-view';

// ----------------------------------------------------------------------

const metadata = { title: `Icon Iconify | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <IconifyView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { BadgeView } from 'src/sections/_examples/mui/badge-view';

// ----------------------------------------------------------------------

const metadata = { title: `Badge | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <BadgeView />
    </>
  );
}

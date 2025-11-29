import { CONFIG } from 'src/global-config';

import { LayoutView } from 'src/sections/_examples/extra/layout-view';

// ----------------------------------------------------------------------

const metadata = { title: `Layout | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <LayoutView />
    </>
  );
}

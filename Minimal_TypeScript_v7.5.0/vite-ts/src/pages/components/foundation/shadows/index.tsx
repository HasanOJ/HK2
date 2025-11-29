import { CONFIG } from 'src/global-config';

import { ShadowsView } from 'src/sections/_examples/foundation/shadows-view';

// ----------------------------------------------------------------------

const metadata = { title: `Shadows | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ShadowsView />
    </>
  );
}

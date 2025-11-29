import { CONFIG } from 'src/global-config';

import { LightboxView } from 'src/sections/_examples/extra/lightbox-view';

// ----------------------------------------------------------------------

const metadata = { title: `Lightbox | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <LightboxView />
    </>
  );
}

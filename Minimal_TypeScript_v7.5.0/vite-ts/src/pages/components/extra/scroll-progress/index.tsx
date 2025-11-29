import { CONFIG } from 'src/global-config';

import { ScrollProgressView } from 'src/sections/_examples/extra/scroll-progress-view';

// ----------------------------------------------------------------------

const metadata = { title: `Scroll progress | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ScrollProgressView />
    </>
  );
}

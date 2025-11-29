import { CONFIG } from 'src/global-config';

import { ScrollbarView } from 'src/sections/_examples/extra/scrollbar-view';

// ----------------------------------------------------------------------

const metadata = { title: `Scrollbar | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ScrollbarView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { NavigationBarView } from 'src/sections/_examples/extra/navigation-bar-view';

// ----------------------------------------------------------------------

const metadata = { title: `Navigation bar | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NavigationBarView />
    </>
  );
}

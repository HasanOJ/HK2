import { CONFIG } from 'src/global-config';

import { TourListView } from 'src/sections/tour/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tour list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TourListView />
    </>
  );
}

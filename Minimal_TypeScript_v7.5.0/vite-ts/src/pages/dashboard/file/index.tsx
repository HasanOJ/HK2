import { CONFIG } from 'src/global-config';

import { OverviewFileView } from 'src/sections/overview/file/view';

// ----------------------------------------------------------------------

const metadata = { title: `File | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <OverviewFileView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { JobListView } from 'src/sections/job/view';

// ----------------------------------------------------------------------

const metadata = { title: `Job list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JobListView />
    </>
  );
}

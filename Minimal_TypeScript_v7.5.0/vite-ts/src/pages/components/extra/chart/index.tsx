import { CONFIG } from 'src/global-config';

import { ChartView } from 'src/sections/_examples/extra/chart-view';

// ----------------------------------------------------------------------

const metadata = { title: `Chart | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ChartView />
    </>
  );
}

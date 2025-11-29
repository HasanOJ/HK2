import { CONFIG } from 'src/global-config';

import { MaintenanceView } from 'src/sections/maintenance/view';

// ----------------------------------------------------------------------

const metadata = { title: `Maintenance - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MaintenanceView />
    </>
  );
}

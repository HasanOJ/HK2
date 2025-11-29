import { CONFIG } from 'src/global-config';

import { PermissionDeniedView } from 'src/sections/permission/view';

// ----------------------------------------------------------------------

const metadata = { title: `Permission | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PermissionDeniedView />
    </>
  );
}

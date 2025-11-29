import { CONFIG } from 'src/global-config';

import { ListView } from 'src/sections/_examples/mui/list-view';

// ----------------------------------------------------------------------

const metadata = { title: `List | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ListView />
    </>
  );
}

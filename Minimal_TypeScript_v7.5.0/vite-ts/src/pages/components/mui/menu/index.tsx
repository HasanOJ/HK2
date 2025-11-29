import { CONFIG } from 'src/global-config';

import { MenuView } from 'src/sections/_examples/mui/menu-view';

// ----------------------------------------------------------------------

const metadata = { title: `Menu | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MenuView />
    </>
  );
}

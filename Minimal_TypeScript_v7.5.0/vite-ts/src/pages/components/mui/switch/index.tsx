import { CONFIG } from 'src/global-config';

import { SwitchView } from 'src/sections/_examples/mui/switch-view';

// ----------------------------------------------------------------------

const metadata = { title: `Switch | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SwitchView />
    </>
  );
}

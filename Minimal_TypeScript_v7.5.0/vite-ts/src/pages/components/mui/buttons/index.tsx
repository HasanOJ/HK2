import { CONFIG } from 'src/global-config';

import { ButtonsView } from 'src/sections/_examples/mui/button-view';

// ----------------------------------------------------------------------

const metadata = { title: `Buttons | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ButtonsView />
    </>
  );
}

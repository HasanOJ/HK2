import { CONFIG } from 'src/global-config';

import { DialogView } from 'src/sections/_examples/mui/dialog-view';

// ----------------------------------------------------------------------

const metadata = { title: `Dialog | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <DialogView />
    </>
  );
}

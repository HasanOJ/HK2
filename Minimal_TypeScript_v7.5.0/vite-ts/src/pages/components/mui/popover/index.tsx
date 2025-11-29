import { CONFIG } from 'src/global-config';

import { PopoverView } from 'src/sections/_examples/mui/popover-view';

// ----------------------------------------------------------------------

const metadata = { title: `Popover | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PopoverView />
    </>
  );
}

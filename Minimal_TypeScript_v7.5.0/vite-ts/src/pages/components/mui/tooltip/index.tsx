import { CONFIG } from 'src/global-config';

import { TooltipView } from 'src/sections/_examples/mui/tooltip-view';

// ----------------------------------------------------------------------

const metadata = { title: `Tooltip | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TooltipView />
    </>
  );
}

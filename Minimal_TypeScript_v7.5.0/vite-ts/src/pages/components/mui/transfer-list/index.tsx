import { CONFIG } from 'src/global-config';

import { TransferListView } from 'src/sections/_examples/mui/transfer-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Transfer list | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TransferListView />
    </>
  );
}

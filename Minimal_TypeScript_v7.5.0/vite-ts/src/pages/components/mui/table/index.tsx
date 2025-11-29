import { CONFIG } from 'src/global-config';

import { TableView } from 'src/sections/_examples/mui/table-view';

// ----------------------------------------------------------------------

const metadata = { title: `Table | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TableView />
    </>
  );
}

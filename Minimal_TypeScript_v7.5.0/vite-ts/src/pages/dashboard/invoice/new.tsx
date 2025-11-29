import { CONFIG } from 'src/global-config';

import { InvoiceCreateView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new invoice | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <InvoiceCreateView />
    </>
  );
}

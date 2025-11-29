import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { _invoices } from 'src/_mock/_invoice';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const currentInvoice = _invoices.find((invoice) => invoice.id === id);

  return (
    <>
      <title>{metadata.title}</title>

      <InvoiceEditView invoice={currentInvoice} />
    </>
  );
}

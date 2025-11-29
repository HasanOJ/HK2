import { CONFIG } from 'src/global-config';

import { PaymentView } from 'src/sections/payment/view';

// ----------------------------------------------------------------------

const metadata = { title: `Payment - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PaymentView />
    </>
  );
}

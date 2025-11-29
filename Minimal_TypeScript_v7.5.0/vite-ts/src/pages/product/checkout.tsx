import { CONFIG } from 'src/global-config';

import { CheckoutView } from 'src/sections/checkout/view';

// ----------------------------------------------------------------------

const metadata = { title: `Checkout - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CheckoutView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { PricingView } from 'src/sections/pricing/view';

// ----------------------------------------------------------------------

const metadata = { title: `Pricing - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PricingView />
    </>
  );
}

import { CONFIG } from 'src/global-config';

import { ProductCreateView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new product | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ProductCreateView />
    </>
  );
}

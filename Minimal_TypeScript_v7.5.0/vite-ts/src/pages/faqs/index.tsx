import { CONFIG } from 'src/global-config';

import { FaqsView } from 'src/sections/faqs/view';

// ----------------------------------------------------------------------

const metadata = { title: `Faqs - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FaqsView />
    </>
  );
}

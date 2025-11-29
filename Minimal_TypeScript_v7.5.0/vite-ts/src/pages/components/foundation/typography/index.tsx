import { CONFIG } from 'src/global-config';

import { TypographyView } from 'src/sections/_examples/foundation/typography-view';

// ----------------------------------------------------------------------

const metadata = { title: `Typography | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TypographyView />
    </>
  );
}

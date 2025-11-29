import { CONFIG } from 'src/global-config';

import { LabelView } from 'src/sections/_examples/extra/label-view';

// ----------------------------------------------------------------------

const metadata = { title: `Label | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <LabelView />
    </>
  );
}

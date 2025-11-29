import { CONFIG } from 'src/global-config';

import { MultiLanguageView } from 'src/sections/_examples/extra/multi-language-view';

// ----------------------------------------------------------------------

const metadata = { title: `Multi-language | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <MultiLanguageView />
    </>
  );
}

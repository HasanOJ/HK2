import { CONFIG } from 'src/global-config';

import { UploadView } from 'src/sections/_examples/extra/upload-view';

// ----------------------------------------------------------------------

const metadata = { title: `Upload | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <UploadView />
    </>
  );
}

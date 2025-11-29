import { CONFIG } from 'src/global-config';

import { ImageView } from 'src/sections/_examples/extra/image-view';

// ----------------------------------------------------------------------

const metadata = { title: `Image | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ImageView />
    </>
  );
}

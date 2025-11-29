import { CONFIG } from 'src/global-config';

import { EditorView } from 'src/sections/_examples/extra/editor-view';

// ----------------------------------------------------------------------

const metadata = { title: `Editor | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <EditorView />
    </>
  );
}

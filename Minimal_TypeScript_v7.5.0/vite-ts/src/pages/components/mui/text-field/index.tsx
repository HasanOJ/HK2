import { CONFIG } from 'src/global-config';

import { TextFieldView } from 'src/sections/_examples/mui/text-field-view';

// ----------------------------------------------------------------------

const metadata = { title: `Text field | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <TextFieldView />
    </>
  );
}

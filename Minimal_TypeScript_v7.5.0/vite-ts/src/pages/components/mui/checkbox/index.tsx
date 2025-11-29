import { CONFIG } from 'src/global-config';

import { CheckboxView } from 'src/sections/_examples/mui/checkbox-view';

// ----------------------------------------------------------------------

const metadata = { title: `Checkbox | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CheckboxView />
    </>
  );
}

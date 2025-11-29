import { CONFIG } from 'src/global-config';

import { RadioButtonView } from 'src/sections/_examples/mui/radio-button-view';

// ----------------------------------------------------------------------

const metadata = { title: `Radio button | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <RadioButtonView />
    </>
  );
}

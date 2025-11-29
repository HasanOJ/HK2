import { CONFIG } from 'src/global-config';

import { StepperView } from 'src/sections/_examples/mui/stepper-view';

// ----------------------------------------------------------------------

const metadata = { title: `Stepper | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <StepperView />
    </>
  );
}

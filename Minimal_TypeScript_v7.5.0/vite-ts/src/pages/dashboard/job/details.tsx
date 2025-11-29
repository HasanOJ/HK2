import { useParams } from 'src/routes/hooks';

import { _jobs } from 'src/_mock/_job';
import { CONFIG } from 'src/global-config';

import { JobDetailsView } from 'src/sections/job/view';

// ----------------------------------------------------------------------

const metadata = { title: `Job details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const currentJob = _jobs.find((job) => job.id === id);

  return (
    <>
      <title>{metadata.title}</title>

      <JobDetailsView job={currentJob} />
    </>
  );
}

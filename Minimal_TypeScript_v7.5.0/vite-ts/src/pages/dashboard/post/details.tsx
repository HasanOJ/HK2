import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useGetPost } from 'src/actions/blog';

import { PostDetailsView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { title = '' } = useParams();

  const { post, postLoading, postError } = useGetPost(title);

  return (
    <>
      <title>{metadata.title}</title>

      <PostDetailsView post={post} loading={postLoading} error={postError} />
    </>
  );
}

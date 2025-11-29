import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useGetPost, useGetLatestPosts } from 'src/actions/blog';

import { PostDetailsHomeView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post details - ${CONFIG.appName}` };

export default function Page() {
  const { title = '' } = useParams();

  const { post, postLoading, postError } = useGetPost(title);

  const { latestPosts } = useGetLatestPosts(title);

  return (
    <>
      <title>{metadata.title}</title>

      <PostDetailsHomeView
        post={post}
        latestPosts={latestPosts}
        loading={postLoading}
        error={postError}
      />
    </>
  );
}

import { CONFIG } from 'src/global-config';
import { useGetPosts } from 'src/actions/blog';

import { PostListHomeView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post list - ${CONFIG.appName}` };

export default function Page() {
  const { posts, postsLoading } = useGetPosts();

  return (
    <>
      <title>{metadata.title}</title>

      <PostListHomeView posts={posts} loading={postsLoading} />
    </>
  );
}

import { useParams, Link } from "react-router-dom";
import { usePerson, usePersonPosts } from "@/hooks/usePeople";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PostCard } from "@/components/PostCard";
import { Loader2, ArrowLeft, User } from "lucide-react";
import { Post } from "@/hooks/usePosts";

const Person = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: person, isLoading: personLoading } = usePerson(slug || "");
  const { data: posts, isLoading: postsLoading } = usePersonPosts(person?.id || "");

  const isLoading = personLoading || postsLoading;

  if (isLoading) {
    return (
      <PageLayoutWithAds>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-dem animate-spin" />
        </div>
      </PageLayoutWithAds>
    );
  }

  if (!person) {
    return (
      <PageLayoutWithAds>
        <div className="text-center py-20">
          <h1 className="font-display text-4xl text-white mb-4">Person Not Found</h1>
          <Link to="/" className="text-dem hover:underline">
            Return Home
          </Link>
        </div>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <main className="w-full pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-dem transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-sm uppercase tracking-wider">Back to Home</span>
        </Link>

        {/* Person Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
            {person.image_url ? (
              <img
                src={person.image_url}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-white/20" />
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
              {person.name}
            </h1>
            {person.bio && (
              <p className="text-white/40 font-body max-w-2xl">
                {person.bio}
              </p>
            )}
          </div>
        </div>

        {/* Person's Posts */}
        <h2 className="font-display text-2xl text-white mb-6">
          Stories featuring <span className="text-dem">{person.name}</span>
        </h2>

        {posts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: Post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                subtitle={post.subtitle}
                youtube_id={post.youtube_id}
                thumbnail_url={post.thumbnail_url}
                created_at={post.created_at}
                content_type={post.content_type}
                is_breaking={post.is_breaking ?? undefined}
                is_featured={post.is_featured ?? undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-white/40 font-body">No stories found featuring this person.</p>
        )}
      </main>
    </PageLayoutWithAds>
  );
};

export default Person;

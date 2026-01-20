import { useParams, Link } from "react-router-dom";
import { usePerson, usePersonPosts } from "@/hooks/usePeople";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
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
      <div className="min-h-screen bg-background">
        <BreakingNewsBanner />
        <Navbar />
        <div className="flex justify-center items-center pt-40">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background">
        <BreakingNewsBanner />
        <Navbar />
        <div className="container mx-auto px-4 pt-40 text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">Person Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BreakingNewsBanner />
      <Navbar />

      <main className="container mx-auto px-4 pt-[120px] pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-sm uppercase tracking-wider">Back to Home</span>
        </Link>

        {/* Person Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-card border border-border shrink-0">
            {person.image_url ? (
              <img
                src={person.image_url}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {person.name}
            </h1>
            {person.bio && (
              <p className="text-muted-foreground font-body max-w-2xl">
                {person.bio}
              </p>
            )}
          </div>
        </div>

        {/* Person's Posts */}
        <h2 className="font-display text-2xl text-foreground mb-6">
          Stories featuring <span className="text-primary">{person.name}</span>
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
          <p className="text-muted-foreground font-body text-center py-12">
            No posts featuring this person yet.
          </p>
        )}
      </main>
    </div>
  );
};

export default Person;

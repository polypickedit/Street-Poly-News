import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { DisqusComments } from "@/components/DisqusComments";
import { RelatedPosts } from "@/components/RelatedPosts";
import { PostBadges } from "@/components/PostBadges";
import { PostTags } from "@/components/PostTags";
import { ArrowLeft, Loader2, Share2, Eye, Calendar, Clock, Twitter, Facebook, Link2, Play } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { getYouTubeId } from "@/lib/utils";
import { Slot } from "@/components/Slot";

interface PostCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface PostPerson {
  id: string;
  name: string;
  slug: string;
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch post with categories and people
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch categories for this post
  const { data: categories } = useQuery({
    queryKey: ["post-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_categories")
        .select("category_id, categories(id, name, slug, color)")
        .eq("post_id", parseInt(id!));

      if (error) throw error;
      return data?.map((pc: { categories: PostCategory }) => pc.categories).filter(Boolean) || [];
    },
    enabled: !!id,
  });

  // Fetch people for this post
  const { data: people } = useQuery({
    queryKey: ["post-people", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_people")
        .select("person_id, people(id, name, slug)")
        .eq("post_id", parseInt(id!));

      if (error) throw error;
      return data?.map((pp: { people: PostPerson }) => pp.people).filter(Boolean) || [];
    },
    enabled: !!id,
  });

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const videoId = getYouTubeId(post?.youtube_id);
  const thumbnail = post?.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');
  const timeAgo = post ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : '';

  if (isLoading) {
    return (
      <PageLayoutWithAds showAds={false}>
        <div className="flex flex-col justify-center items-center pt-40 gap-4">
          <Loader2 className="w-10 h-10 text-dem animate-spin" />
          <p className="text-muted-foreground font-body text-sm">Loading story...</p>
        </div>
      </PageLayoutWithAds>
    );
  }

  if (error || !post) {
    return (
      <PageLayoutWithAds showAds={false}>
        <div className="container mx-auto px-4 pt-40 text-center">
          <h1 className="font-display text-5xl text-foreground mb-4">Story Not Found</h1>
          <p className="text-muted-foreground font-body mb-6">The story you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button variant="outline" size="lg" className="border-dem text-dem hover:bg-dem hover:text-dem-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </PageLayoutWithAds>
    );
  }

  const HeroSection = (
    <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      <img
        src={thumbnail}
        alt={post.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      
      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 flex items-center justify-center group"
          title="Play video"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-dem/90 backdrop-blur-sm flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-dem shadow-2xl shadow-dem/50">
            <Play className="w-10 h-10 md:w-14 md:h-14 text-dem-foreground ml-2" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-8 left-4 md:left-8 inline-flex items-center gap-2 text-foreground/80 hover:text-dem transition-colors bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-body text-sm">Back</span>
      </Link>

      {/* Badges on hero */}
      <div className="absolute bottom-8 left-4 md:left-8">
        <PostBadges
          contentType={post.content_type}
          isBreaking={post.is_breaking}
          isFeatured={post.is_featured}
          categories={categories?.map((c: PostCategory) => ({ name: c.name, color: c.color }))}
        />
      </div>
    </div>
  );

  return (
    <PageLayoutWithAds headerContent={HeroSection} mainClassName="max-w-6xl">
      <div className="-mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Card */}
            <div className="bg-card rounded-2xl p-6 md:p-10 border border-border shadow-xl">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground font-body text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.created_at), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {timeAgo}
                </span>
                {post.view_count && post.view_count > 0 && (
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {post.view_count.toLocaleString()} views
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
                {post.title}
              </h1>
              
              {post.subtitle && (
                <p className="text-muted-foreground font-body text-xl md:text-2xl leading-relaxed border-l-4 border-dem pl-6 mb-8">
                  {post.subtitle}
                </p>
              )}

              {/* Share buttons */}
              <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
                <span className="text-muted-foreground font-body text-sm mr-2">Share:</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('twitter')}
                  className="rounded-full hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('facebook')}
                  className="rounded-full hover:bg-[#4267B2] hover:text-white hover:border-[#4267B2]"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare()}
                  className="rounded-full hover:bg-dem hover:text-dem-foreground hover:border-dem"
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>

              {/* YouTube Embed */}
              {isPlaying && videoId && (
                <div className="aspect-video rounded-xl overflow-hidden bg-background border border-border mb-8 shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title={post.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Body Content */}
              {post.body_content && (
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="font-body text-foreground/90 leading-relaxed space-y-4 text-lg"
                    dangerouslySetInnerHTML={{ __html: post.body_content.replace(/\n/g, '<br/>') }} 
                  />
                </div>
              )}

              {/* Tags Section */}
              <PostTags categories={categories} people={people} />
            </div>

            {/* Comments Section */}
            <div className="bg-card rounded-2xl p-6 md:p-10 border border-border">
              <h2 className="font-display text-2xl text-foreground mb-6">Comments</h2>
              <DisqusComments postId={String(post.id)} title={post.title} />
            </div>

            {/* In-Article Ad Slot */}
            <Slot
              slotKey="post.detail.ad"
              accepts={["ad"]}
              fallback={<div className="h-32 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white/20 uppercase tracking-[0.5em] text-[10px]">Advertisement</div>}
              className="mt-8"
            >
              {() => null}
            </Slot>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Watch Now Card */}
            {!isPlaying && (
              <div className="bg-gradient-to-br from-dem/20 to-dem/5 rounded-2xl p-6 border border-dem/30">
                <h3 className="font-display text-xl text-foreground mb-3">Watch Now</h3>
                <p className="text-muted-foreground text-sm mb-4 font-body">Click to start watching this video</p>
                <Button 
                  onClick={() => setIsPlaying(true)} 
                  className="w-full bg-dem hover:bg-dem/90 text-dem-foreground"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" fill="currentColor" />
                  Play Video
                </Button>
              </div>
            )}

            {/* Related Posts */}
            <RelatedPosts currentPostId={post.id} />

            {/* Tip Button in Sidebar */}
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <div className="w-16 h-16 bg-dem/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">Tell us your story</h3>
              <p className="text-muted-foreground text-sm mb-4 font-body">
                Send us your story tips and exclusive scoops
              </p>
              <Link to="/about">
                <Button variant="outline" className="w-full border-dem text-dem hover:bg-dem hover:text-dem-foreground">Submit Your Story</Button>
              </Link>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-xl text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground text-sm mb-4 font-body">
                Get the latest stories delivered to your inbox
              </p>
              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:border-dem"
                />
                <Button className="w-full bg-dem hover:bg-dem/90 text-dem-foreground">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayoutWithAds>
  );
};

export default PostDetail;
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { usePeople } from "@/hooks/usePeople";
import { Loader2, Plus, Tags, Users } from "lucide-react";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";

const Admin = () => {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPaddingTop = () => {
    return isVisible ? (isMobile ? "pt-[100px]" : "pt-[116px]") : "pt-[36px]";
  };
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    youtube_url: "",
    thumbnail_url: "",
    body_content: "",
    content_type: "video" as "video" | "article" | "gallery",
    is_featured: false,
    is_breaking: false,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#ef4444" });
  const [newPerson, setNewPerson] = useState({ name: "", image_url: "", bio: "" });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: people } = usePeople();

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return url.length === 11 ? url : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let youtubeId = "";
    if (formData.content_type === "video") {
      youtubeId = extractYouTubeId(formData.youtube_url) || "";
      if (!youtubeId) {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube URL or video ID",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const thumbnailUrl =
      formData.thumbnail_url ||
      (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "");

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: formData.title,
        subtitle: formData.subtitle || null,
        youtube_id: youtubeId || "placeholder",
        thumbnail_url: thumbnailUrl || null,
        body_content: formData.body_content || null,
        content_type: formData.content_type,
        is_featured: formData.is_featured,
        is_breaking: formData.is_breaking,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Add categories
    if (selectedCategories.length > 0 && post) {
      await supabase.from("post_categories").insert(
        selectedCategories.map((catId) => ({
          post_id: post.id,
          category_id: catId,
        }))
      );
    }

    // Add people
    if (selectedPeople.length > 0 && post) {
      await supabase.from("post_people").insert(
        selectedPeople.map((personId) => ({
          post_id: post.id,
          person_id: personId,
        }))
      );
    }

    toast({
      title: "Success",
      description: "Post created successfully!",
    });

    setFormData({
      title: "",
      subtitle: "",
      youtube_url: "",
      thumbnail_url: "",
      body_content: "",
      content_type: "video",
      is_featured: false,
      is_breaking: false,
    });
    setSelectedCategories([]);
    setSelectedPeople([]);

    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["featured-posts"] });
    queryClient.invalidateQueries({ queryKey: ["breaking-posts"] });
    setIsSubmitting(false);
  };

  const categoriesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoriesContainerRef.current) {
      const labels = categoriesContainerRef.current.querySelectorAll("[data-bg-color]");
      labels.forEach((label) => {
        const color = (label as HTMLElement).dataset.bgColor;
        if (color) {
          (label as HTMLElement).style.backgroundColor = color;
          (label as HTMLElement).style.color = "white";
        }
      });
    }
  }, [categories]);

  const handleCreateCategory = async () => {
    if (!newCategory.name) return;
    
    const slug = newCategory.name.toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("categories").insert({
      name: newCategory.name,
      slug,
      color: newCategory.color,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Category created!" });
    setNewCategory({ name: "", color: "#ef4444" });
    setShowNewCategory(false);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleCreatePerson = async () => {
    if (!newPerson.name) return;
    
    const slug = newPerson.name.toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("people").insert({
      name: newPerson.name,
      slug,
      image_url: newPerson.image_url || null,
      bio: newPerson.bio || null,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create person", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Person created!" });
    setNewPerson({ name: "", image_url: "", bio: "" });
    setShowNewPerson(false);
    queryClient.invalidateQueries({ queryKey: ["people"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <BreakingNewsBanner />
      <Navbar />

      <main className={`container mx-auto px-4 pb-20 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">
            Create <span className="text-primary">New Post</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-body text-foreground">
                Title *
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter headline"
                className="bg-card border-border text-foreground"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle" className="font-body text-foreground">
                Subtitle
              </Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Brief description"
                className="bg-card border-border text-foreground resize-none"
                rows={2}
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label className="font-body text-foreground">Content Type</Label>
              <div className="flex gap-4">
                {(["video", "article", "gallery"] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="content_type"
                      value={type}
                      checked={formData.content_type === type}
                      onChange={() => setFormData({ ...formData, content_type: type })}
                      className="accent-primary"
                    />
                    <span className="font-body text-sm text-foreground capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* YouTube URL (for video) */}
            {formData.content_type === "video" && (
              <div className="space-y-2">
                <Label htmlFor="youtube_url" className="font-body text-foreground">
                  YouTube URL or Video ID *
                </Label>
                <Input
                  id="youtube_url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-card border-border text-foreground"
                />
              </div>
            )}

            {/* Body Content (for articles) */}
            {formData.content_type === "article" && (
              <div className="space-y-2">
                <Label htmlFor="body_content" className="font-body text-foreground">
                  Article Content
                </Label>
                <Textarea
                  id="body_content"
                  value={formData.body_content}
                  onChange={(e) => setFormData({ ...formData, body_content: e.target.value })}
                  placeholder="Write your article content here..."
                  className="bg-card border-border text-foreground resize-none"
                  rows={10}
                />
              </div>
            )}

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url" className="font-body text-foreground">
                Custom Thumbnail URL
              </Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="Leave empty to use YouTube thumbnail"
                className="bg-card border-border text-foreground"
              />
            </div>

            {/* Flags */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_breaking"
                  checked={formData.is_breaking}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_breaking: checked as boolean })
                  }
                />
                <Label htmlFor="is_breaking" className="font-body text-foreground cursor-pointer">
                  Breaking News
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked as boolean })
                  }
                />
                <Label htmlFor="is_featured" className="font-body text-foreground cursor-pointer">
                  Featured Story
                </Label>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-body text-foreground flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Categories
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>
              
              {showNewCategory && (
                <div className="flex gap-2 p-3 bg-muted rounded-lg">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-card"
                  />
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-14 p-1 bg-card"
                  />
                  <Button type="button" size="sm" onClick={handleCreateCategory}>
                    Create
                  </Button>
                </div>
              )}

              <div ref={categoriesContainerRef} className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <label
                    key={cat.id}
                    data-bg-color={cat.color}
                    className={`px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm font-body ${
                      selectedCategories.includes(cat.id)
                        ? "ring-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                        }
                      }}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* People */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-body text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  People Tags
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPerson(!showNewPerson)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>
              
              {showNewPerson && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <Input
                    placeholder="Person name"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    className="bg-card"
                  />
                  <Input
                    placeholder="Image URL (optional)"
                    value={newPerson.image_url}
                    onChange={(e) => setNewPerson({ ...newPerson, image_url: e.target.value })}
                    className="bg-card"
                  />
                  <Textarea
                    placeholder="Bio (optional)"
                    value={newPerson.bio}
                    onChange={(e) => setNewPerson({ ...newPerson, bio: e.target.value })}
                    className="bg-card resize-none"
                    rows={2}
                  />
                  <Button type="button" size="sm" onClick={handleCreatePerson}>
                    Create Person
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {people?.map((person) => (
                  <label
                    key={person.id}
                    className={`px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm font-body bg-secondary text-secondary-foreground ${
                      selectedPeople.includes(person.id)
                        ? "ring-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedPeople.includes(person.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeople([...selectedPeople, person.id]);
                        } else {
                          setSelectedPeople(selectedPeople.filter((id) => id !== person.id));
                        }
                      }}
                    />
                    {person.name}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body uppercase tracking-wider"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Admin;

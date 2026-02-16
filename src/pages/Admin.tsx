import { PostgrestError } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Loader2, Plus, Tags, Users, Home } from "lucide-react";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContactSubmissions } from "@/components/ContactSubmissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, LayoutGrid, Database as DatabaseIcon } from "lucide-react";

interface Slot {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: "music" | "interview" | "story" | "announcement" | "quick_payment" | "credit_pack" | "merch" | "ad" | "feature";
  is_active: boolean;
  visibility: "public" | "account" | "paid";
}

const Admin = () => {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userProfile, setUserProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
            
          if (error) throw error;
          setUserProfile(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      navigate("/login");
    }
  };

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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [slotFormData, setSlotFormData] = useState<Partial<Slot>>({
    id: "",
    name: "",
    slug: "",
    price: 0,
    type: "music",
    is_active: true,
    visibility: "public",
  });
  const [isEditingSlot, setIsEditingSlot] = useState(false);

  const fetchSlots = useCallback(async () => {
    setIsSlotsLoading(true);
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch services", variant: "destructive" });
    } else {
      const mappedSlots = (data || []).map(s => {
        const slotData = s as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          price: s.price,
          is_active: s.is_active,
          type: slotData.type || "music",
          visibility: slotData.visibility || "public"
        };
      }) as Slot[];
      setSlots(mappedSlots);
    }
    setIsSlotsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSeedDefaults = async () => {
    setIsSubmitting(true);
    const defaults = [
      { id: "00000000-0000-0000-0000-000000000001", name: "New Music Monday", slug: "new-music-monday", price: 300, type: "music" as const, is_active: true, visibility: "public" as const },
      { id: "00000000-0000-0000-0000-000000000002", name: "Featured Interview", slug: "featured-interview", price: 150, type: "interview" as const, is_active: true, visibility: "public" as const },
    ];

    const { error } = await supabase.from("slots").upsert(defaults, { onConflict: 'slug' });
    
    if (error) {
      toast({ title: "Error", description: "Failed to seed default services", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Default services restored!" });
      fetchSlots();
    }
    setIsSubmitting(false);
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: slotFormData.name as string,
      slug: slotFormData.slug || slotFormData.name?.toLowerCase().replace(/\s+/g, "-") as string,
      price: slotFormData.price as number,
      type: slotFormData.type as "music" | "interview" | "ad" | "feature",
      is_active: slotFormData.is_active as boolean,
      visibility: slotFormData.visibility as "public" | "account" | "paid",
    };

    let error: PostgrestError | null = null;
    if (isEditingSlot && slotFormData.id) {
      const { error: updateError } = await supabase
        .from("slots")
        .update(payload)
        .eq("id", slotFormData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("slots")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: `Failed to ${isEditingSlot ? "update" : "create"} service`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Service ${isEditingSlot ? "updated" : "create"} successfully!` });
      setSlotFormData({ id: "", name: "", slug: "", price: 0, type: "music", is_active: true, visibility: "public" });
      setIsEditingSlot(false);
      fetchSlots();
    }
    setIsSubmitting(false);
  };

  const handleEditSlot = (slot: Slot) => {
    setSlotFormData({
      id: slot.id,
      name: slot.name,
      slug: slot.slug,
      price: slot.price,
      type: slot.type,
      is_active: slot.is_active,
      visibility: slot.visibility,
    });
    setIsEditingSlot(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Service deleted successfully!" });
      fetchSlots();
    }
  };

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

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground">
      <BreakingNewsBanner />
      <Navbar />

      <main className={`container mx-auto px-4 pb-20 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-dem uppercase font-black">
                {userProfile?.full_name ? `Welcome, ${userProfile.full_name}` : <>Admin <span className="text-dem">Dashboard</span></>}
              </h1>
              <p className="text-muted-foreground font-medium mt-1">Manage your content and platform settings</p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-center">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="border-dem/50 text-dem hover:bg-dem/10 hover:text-dem font-black uppercase tracking-widest transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Site
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-rep/50 text-rep hover:bg-rep/10 hover:text-rep font-black uppercase tracking-widest transition-all"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px] bg-muted border border-border">
              <TabsTrigger value="posts" className="data-[state=active]:bg-dem data-[state=active]:text-foreground font-black uppercase tracking-widest text-xs">Create Post</TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-dem data-[state=active]:text-foreground font-black uppercase tracking-widest text-xs">Services</TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-dem data-[state=active]:text-foreground font-black uppercase tracking-widest text-xs">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Slot Form */}
                <div className="lg:col-span-1">
                  <Card className="bg-card border-border sticky top-24">
                    <CardHeader>
                      <CardTitle className="font-display text-xl text-dem font-black uppercase">
                        {isEditingSlot ? "Edit Service" : "Add Service"}
                      </CardTitle>
                      <CardDescription>
                        Manage booking options and pricing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSlotSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="slot-name" className="text-xs font-black uppercase tracking-widest">Name</Label>
                          <Input
                            id="slot-name"
                            required
                            value={slotFormData.name}
                            onChange={(e) => setSlotFormData({ ...slotFormData, name: e.target.value })}
                            placeholder="e.g. New Music Monday"
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slot-price" className="text-xs font-black uppercase tracking-widest">Price ($)</Label>
                          <Input
                            id="slot-price"
                            type="number"
                            required
                            value={slotFormData.price}
                            onChange={(e) => setSlotFormData({ ...slotFormData, price: parseFloat(e.target.value) })}
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slot-type" className="text-xs font-black uppercase tracking-widest">Category</Label>
                          <Select
                            value={slotFormData.type}
                            onValueChange={(value: Slot["type"]) => setSlotFormData({ ...slotFormData, type: value })}
                          >
                            <SelectTrigger className="bg-muted">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="music">Music</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                          <Label htmlFor="slot-active" className="text-xs font-black uppercase tracking-widest cursor-pointer">Active Status</Label>
                          <Switch
                            id="slot-active"
                            checked={slotFormData.is_active}
                            onCheckedChange={(checked) => setSlotFormData({ ...slotFormData, is_active: checked })}
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-dem hover:bg-dem/90 font-black uppercase tracking-widest text-xs">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditingSlot ? "Update" : "Create")}
                          </Button>
                          {isEditingSlot && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditingSlot(false);
                                setSlotFormData({ id: "", name: "", slug: "", price: 0, type: "music", is_active: true, visibility: "public" });
                              }}
                              className="font-black uppercase tracking-widest text-xs"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Slot List */}
                <div className="lg:col-span-2">
                  <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-xl text-dem font-black uppercase">Current Services</CardTitle>
                        <CardDescription>Active booking options shown to users</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSeedDefaults}
                          disabled={isSubmitting}
                          className="text-[10px] font-black uppercase tracking-tighter h-8"
                        >
                          <DatabaseIcon className="w-3 h-3 mr-1" />
                          Restore Defaults
                        </Button>
                        <LayoutGrid className="w-5 h-5 text-muted-foreground opacity-50" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-xs font-black uppercase tracking-widest">Service</TableHead>
                              <TableHead className="text-xs font-black uppercase tracking-widest">Category</TableHead>
                              <TableHead className="text-xs font-black uppercase tracking-widest text-right">Price</TableHead>
                              <TableHead className="text-xs font-black uppercase tracking-widest text-center">Status</TableHead>
                              <TableHead className="text-xs font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isSlotsLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-dem" />
                                </TableCell>
                              </TableRow>
                            ) : slots.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium italic">
                                  No services found. Add one to get started.
                                </TableCell>
                              </TableRow>
                            ) : (
                              slots.map((slot) => (
                                <TableRow key={slot.id} className="hover:bg-muted/30 transition-colors">
                                  <TableCell className="font-bold">{slot.name}</TableCell>
                                  <TableCell>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-dem/10 text-dem border border-dem/20">
                                      {slot.type || 'music'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold">${slot.price}</TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${slot.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 opacity-50'}`} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditSlot(slot)}
                                        className="h-8 w-8 text-muted-foreground hover:text-dem hover:bg-dem/10"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteSlot(slot.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-rep hover:bg-rep/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="posts">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-2xl text-dem font-black uppercase mb-6">Create New Post</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-body text-foreground font-black uppercase tracking-widest text-xs">
                Title *
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter headline"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground font-bold"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs">
                Subtitle
              </Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Brief description"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-medium"
                rows={2}
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs">Content Type</Label>
              <div className="flex gap-4">
                {(["video", "article", "gallery"] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="content_type"
                      value={type}
                      checked={formData.content_type === type}
                      onChange={() => setFormData({ ...formData, content_type: type })}
                      className="accent-dem"
                    />
                    <span className="font-body text-sm text-foreground font-bold capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* YouTube URL (for video) */}
            {formData.content_type === "video" && (
              <div className="space-y-2">
                <Label htmlFor="youtube_url" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs">
                  YouTube URL or Video ID *
                </Label>
                <Input
                  id="youtube_url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
                />
              </div>
            )}

            {/* Body Content (for articles) */}
            {formData.content_type === "article" && (
              <div className="space-y-2">
                <Label htmlFor="body_content" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs">
                  Article Content
                </Label>
                <Textarea
                  id="body_content"
                  value={formData.body_content}
                  onChange={(e) => setFormData({ ...formData, body_content: e.target.value })}
                  placeholder="Write your article content here..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-medium"
                  rows={10}
                />
              </div>
            )}

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs">
                Custom Thumbnail URL
              </Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="Leave empty to use YouTube thumbnail"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground font-medium"
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
                  className="border-border data-[state=checked]:bg-dem data-[state=checked]:border-dem"
                />
                <Label htmlFor="is_breaking" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs cursor-pointer">
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
                  className="border-border data-[state=checked]:bg-dem data-[state=checked]:border-dem"
                />
                <Label htmlFor="is_featured" className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs cursor-pointer">
                  Featured Story
                </Label>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Categories
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-muted-foreground hover:text-dem hover:bg-muted font-black uppercase tracking-widest text-[10px]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>
              
              {showNewCategory && (
                <div className="flex gap-2 p-3 bg-muted border border-border rounded-lg">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground font-bold"
                  />
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-14 p-1 bg-card border-border h-10"
                  />
                  <Button type="button" size="sm" onClick={handleCreateCategory} className="bg-dem hover:bg-dem/90 text-foreground font-black uppercase tracking-widest text-[10px]">
                    Create
                  </Button>
                </div>
              )}

              <div ref={categoriesContainerRef} className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <label
                    key={cat.id}
                    data-bg-color={cat.color}
                    className={`px-3 py-1.5 rounded-full cursor-pointer transition-all text-xs font-black uppercase tracking-wider ${
                      selectedCategories.includes(cat.id)
                        ? "ring-2 ring-dem shadow-[0_0_10px_rgba(0,71,171,0.3)]"
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
                <Label className="font-body text-muted-foreground font-black uppercase tracking-widest text-xs flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  People Tags
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPerson(!showNewPerson)}
                  className="text-muted-foreground hover:text-dem hover:bg-muted font-black uppercase tracking-widest text-[10px]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>
              
              {showNewPerson && (
                <div className="space-y-2 p-3 bg-muted border border-border rounded-lg">
                  <Input
                    placeholder="Person name"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground font-bold"
                  />
                  <Input
                    placeholder="Image URL (optional)"
                    value={newPerson.image_url}
                    onChange={(e) => setNewPerson({ ...newPerson, image_url: e.target.value })}
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground font-medium"
                  />
                  <Textarea
                    placeholder="Bio (optional)"
                    value={newPerson.bio}
                    onChange={(e) => setNewPerson({ ...newPerson, bio: e.target.value })}
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none font-medium"
                    rows={2}
                  />
                  <Button type="button" size="sm" onClick={handleCreatePerson} className="bg-dem hover:bg-dem/90 text-foreground font-black uppercase tracking-widest text-[10px]">
                    Create Person
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {people?.map((person) => (
                  <label
                    key={person.id}
                    className={`px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm font-body bg-muted border border-border text-foreground ${
                      selectedPeople.includes(person.id)
                        ? "ring-2 ring-dem shadow-[0_0_10px_rgba(0,71,171,0.3)]"
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
              className="w-full bg-dem hover:bg-dem/90 text-foreground font-body uppercase tracking-wider h-12"
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
            </TabsContent>

            <TabsContent value="messages">
              <ContactSubmissions />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;

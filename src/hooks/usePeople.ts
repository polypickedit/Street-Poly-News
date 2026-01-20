import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";

export interface Person {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  bio: string | null;
  created_at: string;
}

export function usePeople() {
  return useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Person[];
    },
  });
}

export function usePerson(slug: string) {
  return useQuery({
    queryKey: ["person", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Person | null;
    },
    enabled: !!slug,
  });
}

export function usePersonPosts(personId: string) {
  return useQuery({
    queryKey: ["person-posts", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_people")
        .select(`
          post_id,
          posts (*)
        `)
        .eq("person_id", personId);

      if (error) throw error;
      const personPosts = data as unknown as { posts: Post }[];
      return personPosts.map((pp) => pp.posts).filter((post): post is Post => post !== null);
    },
    enabled: !!personId,
  });
}

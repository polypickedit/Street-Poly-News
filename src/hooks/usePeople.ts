import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";

export interface Person {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  bio: string | null;
  created_at: string;
}

export function usePeople() {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["people"],
    queryFn: async ({ signal }) => {
      const data = await safeQuery(
        supabase
          .from("people")
          .select("*")
          .order("name")
          .abortSignal(signal)
      ) as Person[] | null;

      return data || [];
    },
    enabled: appReady,
  });
}

export function usePerson(slug: string) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["person", slug],
    queryFn: async ({ signal }) => {
      const data = await safeQuery(
        supabase
          .from("people")
          .select("*")
          .eq("slug", slug)
          .abortSignal(signal)
          .maybeSingle()
      ) as Person | null;

      return data;
    },
    enabled: appReady && !!slug,
  });
}

export function usePersonPosts(personId: string) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["person-posts", personId],
    queryFn: async ({ signal }) => {
      const data = await safeQuery(
        supabase
          .from("post_people")
          .select(`
            post_id,
            posts (*)
          `)
          .eq("person_id", personId)
          .abortSignal(signal)
      ) as { posts: Post | null }[] | null;

      const personPosts = data || [];
      return personPosts
        .map((pp) => pp.posts)
        .filter((post): post is Post => post !== null);
    },
    enabled: appReady && !!personId,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";
import { SupabaseClient } from "@supabase/supabase-js";

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
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("people")
          .select("*")
          .order("name") as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Person[] | null; error: { code: string; message: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return data as Person[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
  });
}

export function usePerson(slug: string) {
  return useQuery({
    queryKey: ["person", slug],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("people")
          .select("*")
          .eq("slug", slug)
          .maybeSingle() as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Person | null; error: { code: string; message: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return data;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!slug,
  });
}

export function usePersonPosts(personId: string) {
  return useQuery({
    queryKey: ["person-posts", personId],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("post_people")
          .select(`
            post_id,
            posts (*)
          `)
          .eq("person_id", personId) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { posts: Post }[] | null; error: { code: string; message: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        const personPosts = data || [];
        return personPosts.map((pp) => pp.posts).filter((post): post is Post => post !== null);
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!personId,
  });
}

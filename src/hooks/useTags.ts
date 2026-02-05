import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TagItem } from "@/components/TagSelector";

export const useTags = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, category, slug")
        .eq("active", true)
        .order("category")
        .order("name");

      if (!error && data) {
        setTags(data);
      }
      setLoading(false);
    };

    fetchTags();
  }, []);

  return { tags, loading };
};

export const useMentorTags = (mentorId: string | null) => {
  const [mentorTags, setMentorTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorTags = async () => {
    if (!mentorId) {
      setMentorTags([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("mentor_tags")
      .select("tag_id, tags(id, name, category, slug)")
      .eq("mentor_id", mentorId);

    if (!error && data) {
      const tags = data
        .map((item: any) => item.tags)
        .filter(Boolean) as TagItem[];
      setMentorTags(tags);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentorTags();
  }, [mentorId]);

  const updateMentorTags = async (newTags: TagItem[]) => {
    if (!mentorId) return false;

    // Delete all existing tags
    const { error: deleteError } = await supabase
      .from("mentor_tags")
      .delete()
      .eq("mentor_id", mentorId);

    if (deleteError) {
      console.error("Error deleting mentor tags:", deleteError);
      return false;
    }

    // Insert new tags
    if (newTags.length > 0) {
      const insertData = newTags.map((tag) => ({
        mentor_id: mentorId,
        tag_id: tag.id,
      }));

      const { error: insertError } = await supabase
        .from("mentor_tags")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting mentor tags:", insertError);
        return false;
      }
    }

    setMentorTags(newTags);
    return true;
  };

  return { mentorTags, loading, updateMentorTags, refetch: fetchMentorTags };
};

export const useMenteeInterests = (userId: string | null) => {
  const [interests, setInterests] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = async () => {
    if (!userId) {
      setInterests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("mentee_interests")
      .select("tag_id, tags(id, name, category, slug)")
      .eq("user_id", userId);

    if (!error && data) {
      const tags = data
        .map((item: any) => item.tags)
        .filter(Boolean) as TagItem[];
      setInterests(tags);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInterests();
  }, [userId]);

  const updateInterests = async (newTags: TagItem[]) => {
    if (!userId) return false;

    // Delete all existing interests
    const { error: deleteError } = await supabase
      .from("mentee_interests")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting interests:", deleteError);
      return false;
    }

    // Insert new interests
    if (newTags.length > 0) {
      const insertData = newTags.map((tag) => ({
        user_id: userId,
        tag_id: tag.id,
      }));

      const { error: insertError } = await supabase
        .from("mentee_interests")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting interests:", insertError);
        return false;
      }
    }

    setInterests(newTags);
    return true;
  };

  return { interests, loading, updateInterests, refetch: fetchInterests };
};

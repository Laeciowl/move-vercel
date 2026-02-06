import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorCheck } from "@/hooks/useMentorCheck";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  user_type: string;
  sort_order: number;
  active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: number;
  achievement?: Achievement;
}

export interface AchievementStats {
  totalMentorias: number;
  totalMinutes: number;
  uniqueContacts: number; // unique mentees for mentor, unique mentors for mentee
  areasExplored: number;
  contentAccessed: number;
  contentSaved: number;
  reviewsGiven: number;
  currentStreak: number; // months consecutive
}

export const useAchievements = () => {
  const { user } = useAuth();
  const { isMentor, mentorId } = useMentorCheck();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalMentorias: 0,
    totalMinutes: 0,
    uniqueContacts: 0,
    areasExplored: 0,
    contentAccessed: 0,
    contentSaved: 0,
    reviewsGiven: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  const userType = isMentor ? "mentor" : "mentorado";

  const syncAchievementProgress = useCallback(async (
    achievementsList: Achievement[],
    computedStats: AchievementStats
  ) => {
    if (!user || achievementsList.length === 0) return;

    const getProgressForAchievement = (ach: Achievement): number => {
      switch (ach.category) {
        case "mentorias":
          return computedStats.totalMentorias;
        case "tempo":
          return computedStats.totalMinutes;
        case "impacto":
          return computedStats.uniqueContacts;
        case "conteudo":
          return ach.criteria_type === "count" ? computedStats.contentAccessed : computedStats.contentSaved;
        case "exploracao":
          return computedStats.uniqueContacts; // unique mentors explored
        case "areas":
          return computedStats.areasExplored; // unique mentor areas
        case "engajamento":
          return computedStats.reviewsGiven;
        case "consistencia":
          return computedStats.currentStreak;
        default:
          return 0;
      }
    };

    const upserts = achievementsList.map(ach => {
      const progress = getProgressForAchievement(ach);
      const isUnlocked = progress >= ach.criteria_value;
      return {
        user_id: user.id,
        achievement_id: ach.id,
        progress,
        unlocked_at: isUnlocked ? new Date().toISOString() : null,
      };
    });

    // Fetch existing to preserve original unlocked_at
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);

    const existingMap = new Map((existing || []).map(e => [e.achievement_id, e]));

    for (const upsert of upserts) {
      const prev = existingMap.get(upsert.achievement_id);
      if (prev) {
        // Update progress and unlocked_at
        const updateData: any = { progress: upsert.progress };
        if (!prev.unlocked_at && upsert.unlocked_at) {
          // Newly unlocked
          updateData.unlocked_at = upsert.unlocked_at;
        } else if (prev.unlocked_at && !upsert.unlocked_at) {
          // Previously unlocked but no longer meets criteria - reset
          updateData.unlocked_at = null;
        }
        await supabase
          .from("user_achievements")
          .update(updateData)
          .eq("id", prev.id);
      } else {
        await supabase
          .from("user_achievements")
          .insert(upsert);
      }
    }

    // Re-fetch user achievements after sync
    const { data: updatedData } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);

    if (updatedData) {
      setUserAchievements(updatedData as UserAchievement[]);
    }
  }, [user]);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    // Fetch all achievements for this user type
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .eq("active", true)
      .or(`user_type.eq.${userType},user_type.eq.ambos`)
      .order("sort_order");

    if (achievementsData) {
      setAchievements(achievementsData as Achievement[]);
    }

    // Calculate stats first
    const computedStats = await calculateStats();

    // Sync progress to DB
    if (achievementsData && computedStats) {
      await syncAchievementProgress(achievementsData as Achievement[], computedStats);
    }

    setLoading(false);
  }, [user, userType, mentorId, syncAchievementProgress]);

  const calculateStats = async (): Promise<AchievementStats | null> => {
    if (!user) return null;

    const result: AchievementStats = {
      totalMentorias: 0, totalMinutes: 0, uniqueContacts: 0,
      areasExplored: 0, contentAccessed: 0, contentSaved: 0,
      reviewsGiven: 0, currentStreak: 0,
    };

    if (isMentor && mentorId) {
      const { data: sessions } = await supabase
        .from("mentor_sessions")
        .select("user_id, duration, scheduled_at, status")
        .eq("mentor_id", mentorId);

      if (sessions) {
        const now = new Date();
        const completedSessions = sessions.filter(s => {
          if (s.status === "cancelled") return false;
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return endTime <= now;
        });

        result.totalMentorias = completedSessions.length;
        result.totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 30), 0);
        result.uniqueContacts = new Set(completedSessions.map(s => s.user_id)).size;
      }

      // For mentors, areasExplored = their own tags count
      const { data: myTags } = await supabase
        .from("mentor_tags")
        .select("tag_id")
        .eq("mentor_id", mentorId);
      if (myTags) result.areasExplored = myTags.length;
    } else {
      const { data: sessions } = await supabase
        .from("mentor_sessions")
        .select("mentor_id, duration, scheduled_at, status")
        .eq("user_id", user.id);

      if (sessions) {
        const now = new Date();
        const completedSessions = sessions.filter(s => {
          if (s.status === "cancelled") return false;
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return endTime <= now;
        });

        result.totalMentorias = completedSessions.length;
        result.totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 30), 0);
        result.uniqueContacts = new Set(completedSessions.map(s => s.mentor_id)).size;

        const mentorIds = [...new Set(completedSessions.map(s => s.mentor_id))];
        // areasExplored = unique mentor areas (not tags)
        if (mentorIds.length > 0) {
          const { data: mentorAreas } = await supabase
            .from("mentors")
            .select("area")
            .in("id", mentorIds);
          if (mentorAreas) result.areasExplored = new Set(mentorAreas.map(m => m.area)).size;
        }

        const { count: contentCount } = await supabase
          .from("content_access_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: saveCount } = await supabase
          .from("content_saves")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: reviewCount } = await supabase
          .from("session_reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        result.contentAccessed = contentCount || 0;
        result.contentSaved = saveCount || 0;
        result.reviewsGiven = reviewCount || 0;
      }
    }

    setStats(result);
    return result;
  };

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Merge achievements with user progress
  const achievementsWithProgress = achievements.map(ach => {
    const userAch = userAchievements.find(ua => ua.achievement_id === ach.id);
    return {
      ...ach,
      progress: userAch?.progress || 0,
      unlocked_at: userAch?.unlocked_at || null,
      isUnlocked: !!userAch?.unlocked_at,
    };
  });

  const unlockedCount = achievementsWithProgress.filter(a => a.isUnlocked).length;
  const totalCount = achievementsWithProgress.length;
  const overallProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Get next achievement to unlock (closest to completion)
  const nextAchievement = achievementsWithProgress
    .filter(a => !a.isUnlocked)
    .sort((a, b) => {
      const aProgress = a.criteria_value > 0 ? a.progress / a.criteria_value : 0;
      const bProgress = b.criteria_value > 0 ? b.progress / b.criteria_value : 0;
      return bProgress - aProgress;
    })[0] || null;

  // Group by category
  const achievementsByCategory = achievementsWithProgress.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, typeof achievementsWithProgress>);

  // Recent unlocked (last 3)
  const recentUnlocked = achievementsWithProgress
    .filter(a => a.isUnlocked)
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3);

  return {
    achievements: achievementsWithProgress,
    achievementsByCategory,
    stats,
    unlockedCount,
    totalCount,
    overallProgress,
    nextAchievement,
    recentUnlocked,
    loading,
    refresh: fetchAchievements,
    userType,
  };
};

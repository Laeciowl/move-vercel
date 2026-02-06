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

    // Fetch user's achievement progress
    const { data: userAchData } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);

    if (userAchData) {
      setUserAchievements(userAchData as UserAchievement[]);
    }

    // Calculate stats
    await calculateStats();

    setLoading(false);
  }, [user, userType, mentorId]);

  const calculateStats = async () => {
    if (!user) return;

    if (isMentor && mentorId) {
      // Mentor stats
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

        const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 30), 0);
        const uniqueMentees = new Set(completedSessions.map(s => s.user_id)).size;

        setStats(prev => ({
          ...prev,
          totalMentorias: completedSessions.length,
          totalMinutes,
          uniqueContacts: uniqueMentees,
        }));
      }
    } else {
      // Mentee stats
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

        const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 30), 0);
        const uniqueMentors = new Set(completedSessions.map(s => s.mentor_id)).size;

        // Count areas explored via mentor tags
        const mentorIds = [...new Set(completedSessions.map(s => s.mentor_id))];
        let areasExplored = 0;
        if (mentorIds.length > 0) {
          const { data: tags } = await supabase
            .from("mentor_tags")
            .select("tag_id")
            .in("mentor_id", mentorIds);
          if (tags) {
            areasExplored = new Set(tags.map(t => t.tag_id)).size;
          }
        }

        // Content stats
        const { count: contentCount } = await supabase
          .from("content_access_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: saveCount } = await supabase
          .from("content_saves")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Reviews
        const { count: reviewCount } = await supabase
          .from("session_reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setStats(prev => ({
          ...prev,
          totalMentorias: completedSessions.length,
          totalMinutes,
          uniqueContacts: uniqueMentors,
          areasExplored,
          contentAccessed: contentCount || 0,
          contentSaved: saveCount || 0,
          reviewsGiven: reviewCount || 0,
        }));
      }
    }
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

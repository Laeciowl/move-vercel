import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, BookOpen, Calendar, CheckCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

// Event to trigger tab changes and scrolling in components
export const triggerNotificationAction = (action: { type: string; target?: string; tab?: string }) => {
  window.dispatchEvent(new CustomEvent("notification-action", { detail: action }));
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mentorship_request":
        return <Users className="w-4 h-4 text-primary" />;
      case "session_confirmed":
      case "session_cancelled":
        return <Calendar className="w-4 h-4 text-primary" />;
      case "volunteer_approval":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "content":
        return <BookOpen className="w-4 h-4 text-secondary" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Map notification types to routes/anchors and tab actions
  const getNotificationAction = (type: string): { route: string; tab?: string; scrollTo?: string } | null => {
    switch (type) {
      case "mentorship_request":
        // For mentors: go to volunteer panel agenda tab
        return { route: "/dashboard", tab: "agenda", scrollTo: "volunteer-panel" };
      case "session_confirmed":
      case "session_cancelled":
        // For students: scroll to their sessions
        return { route: "/dashboard", scrollTo: "mentorship-section" };
      case "volunteer_approval":
        return { route: "/dashboard", tab: "overview", scrollTo: "volunteer-panel" };
      case "content":
        // New content available: go to content page
        return { route: "/conteudos" };
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    const action = getNotificationAction(notification.type);
    
    if (action) {
      setIsOpen(false);
      
      // If already on dashboard, just trigger the action
      if (location.pathname === "/dashboard") {
        // Dispatch action for components to react
        triggerNotificationAction({ 
          type: notification.type, 
          target: action.scrollTo,
          tab: action.tab 
        });
        
        // Scroll to element
        if (action.scrollTo) {
          setTimeout(() => {
            const element = document.getElementById(action.scrollTo!);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
              // Add highlight effect
              element.classList.add("notification-highlight");
              setTimeout(() => element.classList.remove("notification-highlight"), 2000);
            }
          }, 100);
        }
      } else {
        // Navigate first, then trigger action
        navigate(action.route);
        setTimeout(() => {
          triggerNotificationAction({ 
            type: notification.type, 
            target: action.scrollTo,
            tab: action.tab 
          });
          
          if (action.scrollTo) {
            setTimeout(() => {
              const element = document.getElementById(action.scrollTo!);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
                element.classList.add("notification-highlight");
                setTimeout(() => element.classList.remove("notification-highlight"), 2000);
              }
            }, 100);
          }
        }, 300);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && !error) {
        setNotifications(data as unknown as Notification[]);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-full hover:bg-muted/60 transition-all duration-200"
        >
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-button"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50 shadow-card">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Marcar todas como lidas
              </motion.button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Tudo tranquilo por aqui! 😊
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left border-b border-border/30 last:border-0 hover:bg-muted/40 transition-all duration-200 group ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"
                      >
                        {getNotificationIcon(notification.type)}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-primary shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-muted-foreground/70">
                            {getTimeAgo(notification.created_at)}
                          </p>
                          {getNotificationAction(notification.type) && (
                            <motion.span 
                              initial={{ x: 0 }}
                              whileHover={{ x: 3 }}
                              className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Ver →
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
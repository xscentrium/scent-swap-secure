import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// Helper to show browser push notification
const showPushNotification = (title: string, body: string, onClick?: () => void) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${Date.now()}`,
        requireInteraction: false
      });
      
      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error showing push notification:', error);
    }
  }
};

export const useNotifications = () => {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profileId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter((n) => !n.read).length || 0);
    setLoading(false);
  }, [profileId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!profileId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to new notifications. Use a user-scoped topic so reconnects after OAuth
    // never reuse a channel that has already been subscribed.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`notifications-${profileId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profileId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Show in-app toast
            toast(newNotification.title, {
              description: newNotification.message,
            });

            // Show browser push notification based on type
            if (newNotification.type === 'trade_match') {
              showPushNotification(
                '🎯 ' + newNotification.title,
                newNotification.message,
                () => { window.location.href = '/trade-matches'; }
              );
            } else if (newNotification.type === 'trade_message') {
              showPushNotification(
                '💬 ' + newNotification.title,
                newNotification.message,
                () => { window.location.href = '/messages'; }
              );
            } else if (newNotification.type === 'badge_earned') {
              showPushNotification(
                '🏆 ' + newNotification.title,
                newNotification.message,
                () => { window.location.href = '/profile'; }
              );
            } else if (newNotification.type === 'trade_proposal') {
              showPushNotification(
                '🤝 ' + newNotification.title,
                newNotification.message,
                () => { window.location.href = '/my-trades'; }
              );
            } else if (newNotification.type?.startsWith('escrow_')) {
              const emoji = newNotification.type === 'escrow_disputed' ? '⚠️'
                : newNotification.type === 'escrow_released' ? '✅'
                : newNotification.type === 'escrow_refunded' ? '↩️' : '🔒';
              showPushNotification(
                `${emoji} ${newNotification.title}`,
                newNotification.message,
                () => { window.location.href = '/my-trades'; }
              );
            } else {
              showPushNotification(newNotification.title, newNotification.message);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profileId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

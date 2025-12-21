import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const NotificationPermissionBanner = () => {
  const { profile } = useAuth();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const wasDismissed = localStorage.getItem('notification-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setDismissed(true);
    }
  };

  // Don't show if not logged in, not supported, already granted, or dismissed
  if (!profile || !isSupported || permission === 'granted' || dismissed) {
    return null;
  }

  // Don't show if permission was denied (user would need to change in browser settings)
  if (permission === 'denied') {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <span className="text-sm">
            Enable push notifications to get alerts for trade matches, messages, and badge unlocks!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleEnable}>
            Enable
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

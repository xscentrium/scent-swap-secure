import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'xscentrium-cookie-consent';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <Card className="max-w-4xl mx-auto border-border/50 shadow-luxury bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <Cookie className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">We value your privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                      By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      for more information.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                  <Button variant="outline" onClick={handleDecline} className="flex-1 md:flex-none">
                    Essential Only
                  </Button>
                  <Button onClick={handleAccept} className="flex-1 md:flex-none">
                    Accept All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

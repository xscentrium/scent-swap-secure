import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from "@/components/SEO";
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { ScentProfileQuiz } from '@/components/ScentProfileQuiz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle } from 'lucide-react';

const ScentQuiz = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  // Check if user has existing preferences (scent_preferences column may exist)
  const hasExistingPreferences = false; // Will be updated when profile types are regenerated

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-bold mb-4">Discover Your Scent Profile</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to take the quiz and get personalized fragrance recommendations.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign In to Continue</Button>
          </div>
        </main>
      </div>
    );
  }

  if (completed || hasExistingPreferences) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Your Scent Profile is Ready!</CardTitle>
                <CardDescription>
                  We'll use your preferences to give you personalized recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/discover')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </Button>
                  <Button variant="outline" onClick={() => setCompleted(false)}>
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Scent Profile Quiz | Xscentrium" description="Take the Xscentrium scent profile quiz and get personalized fragrance recommendations." path="/scent-quiz" />
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-bold mb-2">Discover Your Scent Profile</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Answer a few questions to help us understand your fragrance preferences and get personalized recommendations.
            </p>
          </div>
          <ScentProfileQuiz onComplete={() => setCompleted(true)} />
        </div>
      </main>
    </div>
  );
};

export default ScentQuiz;

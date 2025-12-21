import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type QuizStep = {
  id: string;
  question: string;
  description: string;
  options: { value: string; label: string; emoji?: string }[];
  multiSelect?: boolean;
};

const quizSteps: QuizStep[] = [
  {
    id: 'intensity',
    question: 'How strong do you like your fragrances?',
    description: 'This helps us recommend fragrances with the right projection',
    options: [
      { value: 'light', label: 'Light & Subtle', emoji: '🌸' },
      { value: 'moderate', label: 'Moderate', emoji: '🌿' },
      { value: 'strong', label: 'Bold & Powerful', emoji: '🔥' },
    ],
  },
  {
    id: 'families',
    question: 'Which scent families appeal to you?',
    description: 'Select all that you enjoy',
    multiSelect: true,
    options: [
      { value: 'fresh', label: 'Fresh & Citrus', emoji: '🍋' },
      { value: 'floral', label: 'Floral', emoji: '🌹' },
      { value: 'woody', label: 'Woody', emoji: '🌲' },
      { value: 'oriental', label: 'Oriental & Spicy', emoji: '✨' },
      { value: 'gourmand', label: 'Sweet & Gourmand', emoji: '🍰' },
      { value: 'aquatic', label: 'Aquatic & Marine', emoji: '🌊' },
    ],
  },
  {
    id: 'occasions',
    question: 'When do you typically wear fragrance?',
    description: 'Select all that apply',
    multiSelect: true,
    options: [
      { value: 'daily', label: 'Daily Wear', emoji: '☀️' },
      { value: 'work', label: 'Office/Work', emoji: '💼' },
      { value: 'date', label: 'Date Night', emoji: '❤️' },
      { value: 'special', label: 'Special Events', emoji: '🎉' },
      { value: 'casual', label: 'Casual Outings', emoji: '🛍️' },
    ],
  },
  {
    id: 'seasons',
    question: 'Which seasons do you need fragrances for?',
    description: 'Select all that apply',
    multiSelect: true,
    options: [
      { value: 'spring', label: 'Spring', emoji: '🌸' },
      { value: 'summer', label: 'Summer', emoji: '☀️' },
      { value: 'fall', label: 'Fall', emoji: '🍂' },
      { value: 'winter', label: 'Winter', emoji: '❄️' },
    ],
  },
  {
    id: 'notes',
    question: 'Which notes do you love?',
    description: 'Select your favorites',
    multiSelect: true,
    options: [
      { value: 'vanilla', label: 'Vanilla', emoji: '🍦' },
      { value: 'amber', label: 'Amber', emoji: '🔶' },
      { value: 'oud', label: 'Oud', emoji: '🪵' },
      { value: 'rose', label: 'Rose', emoji: '🌹' },
      { value: 'bergamot', label: 'Bergamot', emoji: '🍊' },
      { value: 'musk', label: 'Musk', emoji: '🤍' },
      { value: 'sandalwood', label: 'Sandalwood', emoji: '🪵' },
      { value: 'jasmine', label: 'Jasmine', emoji: '🌼' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your typical fragrance budget?',
    description: 'Per bottle',
    options: [
      { value: 'budget', label: 'Under $50', emoji: '💵' },
      { value: 'mid', label: '$50 - $150', emoji: '💰' },
      { value: 'high', label: '$150 - $300', emoji: '💎' },
      { value: 'luxury', label: '$300+', emoji: '👑' },
    ],
  },
];

export const ScentProfileQuiz = ({ onComplete }: { onComplete?: () => void }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const saveMutation = useMutation({
    mutationFn: async (preferences: Record<string, string | string[]>) => {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ scent_preferences: preferences })
        .eq('id', profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Your scent profile has been saved!');
      onComplete?.();
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const step = quizSteps[currentStep];
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  const handleSelect = (value: string) => {
    if (step.multiSelect) {
      const current = (answers[step.id] as string[]) || [];
      if (current.includes(value)) {
        setAnswers({ ...answers, [step.id]: current.filter(v => v !== value) });
      } else {
        setAnswers({ ...answers, [step.id]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [step.id]: value });
    }
  };

  const isSelected = (value: string) => {
    const answer = answers[step.id];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  const canProceed = () => {
    const answer = answers[step.id];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  const handleNext = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      saveMutation.mutate(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {quizSteps.length}
          </span>
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle>{step.question}</CardTitle>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {step.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                isSelected(option.value)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                {option.emoji && <span className="text-xl">{option.emoji}</span>}
                <span className="font-medium">{option.label}</span>
                {isSelected(option.value) && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saveMutation.isPending}
          >
            {currentStep === quizSteps.length - 1 ? (
              <>
                {saveMutation.isPending ? 'Saving...' : 'Complete'}
                <Check className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star, ThumbsUp, ThumbsDown, Clock, Wind, DollarSign, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FragranceReviewsProps {
  fragranceName: string;
  fragranceBrand: string;
}

type Review = {
  id: string;
  profile_id: string;
  fragrance_name: string;
  fragrance_brand: string;
  overall_rating: number;
  longevity_rating: number | null;
  sillage_rating: number | null;
  value_rating: number | null;
  review_text: string | null;
  pros: string[] | null;
  cons: string[] | null;
  season_preferences: string[] | null;
  occasion_preferences: string[] | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

const StarRating = ({ 
  value, 
  onChange, 
  readonly = false 
}: { 
  value: number; 
  onChange?: (v: number) => void; 
  readonly?: boolean;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`w-5 h-5 ${star <= value ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}
          />
        </button>
      ))}
    </div>
  );
};

export const FragranceReviews = ({ fragranceName, fragranceBrand }: FragranceReviewsProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    overall_rating: 0,
    longevity_rating: 0,
    sillage_rating: 0,
    value_rating: 0,
    review_text: '',
    pros: '',
    cons: '',
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['fragrance-reviews', fragranceName, fragranceBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fragrance_reviews')
        .select(`
          *,
          profiles:profile_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('fragrance_name', fragranceName)
        .eq('fragrance_brand', fragranceBrand)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: userReview } = useQuery({
    queryKey: ['user-fragrance-review', fragranceName, fragranceBrand, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('fragrance_reviews')
        .select('*')
        .eq('fragrance_name', fragranceName)
        .eq('fragrance_brand', fragranceBrand)
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!profile?.id,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Must be logged in');
      
      const reviewData = {
        profile_id: profile.id,
        fragrance_name: fragranceName,
        fragrance_brand: fragranceBrand,
        overall_rating: formData.overall_rating,
        longevity_rating: formData.longevity_rating || null,
        sillage_rating: formData.sillage_rating || null,
        value_rating: formData.value_rating || null,
        review_text: formData.review_text || null,
        pros: formData.pros ? formData.pros.split(',').map(p => p.trim()).filter(Boolean) : null,
        cons: formData.cons ? formData.cons.split(',').map(p => p.trim()).filter(Boolean) : null,
      };

      if (editingReview) {
        const { error } = await supabase
          .from('fragrance_reviews')
          .update(reviewData)
          .eq('id', editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fragrance_reviews')
          .insert(reviewData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fragrance-reviews', fragranceName, fragranceBrand] });
      queryClient.invalidateQueries({ queryKey: ['user-fragrance-review', fragranceName, fragranceBrand, profile?.id] });
      setDialogOpen(false);
      setEditingReview(null);
      resetForm();
      toast.success(editingReview ? 'Review updated!' : 'Review submitted!');
    },
    onError: () => {
      toast.error('Failed to submit review');
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('fragrance_reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fragrance-reviews', fragranceName, fragranceBrand] });
      queryClient.invalidateQueries({ queryKey: ['user-fragrance-review', fragranceName, fragranceBrand, profile?.id] });
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  const resetForm = () => {
    setFormData({
      overall_rating: 0,
      longevity_rating: 0,
      sillage_rating: 0,
      value_rating: 0,
      review_text: '',
      pros: '',
      cons: '',
    });
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      overall_rating: review.overall_rating,
      longevity_rating: review.longevity_rating || 0,
      sillage_rating: review.sillage_rating || 0,
      value_rating: review.value_rating || 0,
      review_text: review.review_text || '',
      pros: review.pros?.join(', ') || '',
      cons: review.cons?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const averageRating = reviews?.length 
    ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Reviews</h3>
          {averageRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-medium">{averageRating}</span>
              <span className="text-muted-foreground text-sm">({reviews?.length})</span>
            </div>
          )}
        </div>
        
        {profile && !userReview && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Write Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingReview ? 'Edit Review' : 'Write a Review'}</DialogTitle>
                <DialogDescription>
                  {fragranceName} by {fragranceBrand}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); submitReview.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Overall Rating *</Label>
                  <StarRating 
                    value={formData.overall_rating} 
                    onChange={(v) => setFormData({ ...formData, overall_rating: v })} 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" /> Longevity
                    </Label>
                    <StarRating 
                      value={formData.longevity_rating} 
                      onChange={(v) => setFormData({ ...formData, longevity_rating: v })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <Wind className="w-3 h-3" /> Sillage
                    </Label>
                    <StarRating 
                      value={formData.sillage_rating} 
                      onChange={(v) => setFormData({ ...formData, sillage_rating: v })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs">
                      <DollarSign className="w-3 h-3" /> Value
                    </Label>
                    <StarRating 
                      value={formData.value_rating} 
                      onChange={(v) => setFormData({ ...formData, value_rating: v })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your Review</Label>
                  <Textarea
                    value={formData.review_text}
                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                    placeholder="Share your experience with this fragrance..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm">
                      <ThumbsUp className="w-3 h-3 text-green-500" /> Pros
                    </Label>
                    <Textarea
                      value={formData.pros}
                      onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                      placeholder="Great longevity, unique scent..."
                      rows={2}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm">
                      <ThumbsDown className="w-3 h-3 text-red-500" /> Cons
                    </Label>
                    <Textarea
                      value={formData.cons}
                      onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                      placeholder="Expensive, weak projection..."
                      rows={2}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitReview.isPending || !formData.overall_rating}>
                  {submitReview.isPending ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {review.profiles?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {review.profiles?.display_name || review.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.overall_rating} readonly />
                    {profile?.id === review.profile_id && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(review)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => deleteReview.mutate(review.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {(review.longevity_rating || review.sillage_rating || review.value_rating) && (
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    {review.longevity_rating && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {review.longevity_rating}/5
                      </span>
                    )}
                    {review.sillage_rating && (
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3" /> {review.sillage_rating}/5
                      </span>
                    )}
                    {review.value_rating && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> {review.value_rating}/5
                      </span>
                    )}
                  </div>
                )}

                {review.review_text && (
                  <p className="mt-3 text-sm">{review.review_text}</p>
                )}

                {(review.pros?.length || review.cons?.length) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.pros?.map((pro) => (
                      <Badge key={pro} variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <ThumbsUp className="w-3 h-3 mr-1" /> {pro}
                      </Badge>
                    ))}
                    {review.cons?.map((con) => (
                      <Badge key={con} variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        <ThumbsDown className="w-3 h-3 mr-1" /> {con}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8 text-sm">
          No reviews yet. Be the first to review this fragrance!
        </p>
      )}
    </div>
  );
};

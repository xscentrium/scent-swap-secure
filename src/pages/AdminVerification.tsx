import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Loader2, Shield, CheckCircle, XCircle, 
  Clock, User, Eye, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type VerificationSubmission = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  id_document_url: string | null;
  id_verification_status: string | null;
  id_submitted_at: string | null;
  created_at: string | null;
};

const AdminVerification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<VerificationSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check if user is admin/moderator
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) return false;
      
      if (!data) {
        const { data: modData } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'moderator'
        });
        return modData || false;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending verifications
  const { data: pendingSubmissions, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, id_document_url, id_verification_status, id_submitted_at, created_at')
        .eq('id_verification_status', 'pending')
        .order('id_submitted_at', { ascending: true });
      
      if (error) throw error;
      return data as VerificationSubmission[];
    },
    enabled: isAdmin === true,
  });

  // Fetch all submissions for history
  const { data: allSubmissions, isLoading: allLoading } = useQuery({
    queryKey: ['all-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, id_document_url, id_verification_status, id_submitted_at, created_at')
        .in('id_verification_status', ['verified', 'rejected', 'pending'])
        .order('id_submitted_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as VerificationSubmission[];
    },
    enabled: isAdmin === true,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          id_verified: true,
          id_verification_status: 'verified',
        })
        .eq('id', profileId);
      
      if (error) throw error;

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: profileId,
          type: 'verification_approved',
          title: 'ID Verified!',
          message: 'Your identity has been verified. You can now trade on the platform.',
        });
    },
    onSuccess: () => {
      toast.success('Verification approved');
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-verifications'] });
      setSelectedSubmission(null);
    },
    onError: () => {
      toast.error('Failed to approve verification');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          id_verified: false,
          id_verification_status: 'rejected',
        })
        .eq('id', profileId);
      
      if (error) throw error;

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: profileId,
          type: 'verification_rejected',
          title: 'ID Verification Rejected',
          message: reason || 'Your ID verification was rejected. Please submit a clearer document.',
        });
    },
    onSuccess: () => {
      toast.success('Verification rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-verifications'] });
      setSelectedSubmission(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Failed to reject verification');
    },
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-32">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Admin Verification Panel</h1>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pending
                {pendingSubmissions && pendingSubmissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingSubmissions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : pendingSubmissions && pendingSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {pendingSubmissions.map((submission) => (
                    <Card key={submission.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              {submission.avatar_url && <AvatarImage src={submission.avatar_url} />}
                              <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{submission.display_name || submission.username}</p>
                              <p className="text-sm text-muted-foreground">@{submission.username}</p>
                              {submission.id_submitted_at && (
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {format(new Date(submission.id_submitted_at), 'PPp')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">All caught up!</h3>
                    <p className="text-muted-foreground">No pending verifications to review.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
              {allLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : allSubmissions && allSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {allSubmissions.map((submission) => (
                    <Card key={submission.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10">
                              {submission.avatar_url && <AvatarImage src={submission.avatar_url} />}
                              <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{submission.display_name || submission.username}</p>
                              <p className="text-sm text-muted-foreground">@{submission.username}</p>
                            </div>
                          </div>
                          {getStatusBadge(submission.id_verification_status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No verification history.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review ID Verification</DialogTitle>
            <DialogDescription>
              Review the submitted ID document and approve or reject the verification.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {selectedSubmission.avatar_url && <AvatarImage src={selectedSubmission.avatar_url} />}
                  <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{selectedSubmission.display_name || selectedSubmission.username}</p>
                  <p className="text-muted-foreground">@{selectedSubmission.username}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Submitted ID Document:</p>
                {selectedSubmission.id_document_url ? (
                  <div className="relative">
                    <img
                      src={selectedSubmission.id_document_url}
                      alt="ID Document"
                      className="w-full max-h-96 object-contain rounded-lg border border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => window.open(selectedSubmission.id_document_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Full Size
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No document uploaded</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => selectedSubmission && approveMutation.mutate(selectedSubmission.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this verification (optional but recommended).
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., ID is blurry, document appears expired, etc."
            rows={3}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubmission && rejectMutation.mutate({ 
                profileId: selectedSubmission.id, 
                reason: rejectionReason 
              })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerification;
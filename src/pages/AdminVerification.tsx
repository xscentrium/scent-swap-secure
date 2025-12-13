import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Loader2, Shield, CheckCircle, XCircle, 
  Clock, User, Eye, ExternalLink, UserPlus, Crown, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

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

type UserWithRole = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
};

const AdminVerification = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<VerificationSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('moderator');

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

  // Search for users to assign roles
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: async () => {
      if (!userSearch.trim()) return [];
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${userSearch}%,display_name.ilike.%${userSearch}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Get roles for each user
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);
          
          return {
            ...profile,
            roles: (roles || []).map(r => r.role),
          };
        })
      );
      
      return usersWithRoles;
    },
    enabled: isAdmin === true && userSearch.length >= 2,
  });

  // Fetch users with roles
  const { data: usersWithRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (error) throw error;
      
      // Get unique user IDs
      const userIds = [...new Set((roles || []).map(r => r.user_id))];
      
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', userIds);
      
      return (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || []).filter(r => r.user_id === profile.user_id).map(r => r.role),
      })) as UserWithRole[];
    },
    enabled: isAdmin === true,
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Failed to assign role');
      }
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role removed successfully');
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
    onError: () => {
      toast.error('Failed to remove role');
    },
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
              <TabsTrigger value="roles">
                <Crown className="w-4 h-4 mr-1" />
                User Roles
              </TabsTrigger>
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

            <TabsContent value="roles">
              <div className="space-y-6">
                {/* Search and Add Role */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Assign Role to User
                    </h3>
                    <div className="flex gap-4 flex-col sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users by username..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search Results */}
                    {userSearch.length >= 2 && (
                      <div className="mt-4 space-y-2">
                        {searchLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          searchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{user.display_name || user.username}</p>
                                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                                </div>
                                <div className="flex gap-1">
                                  {user.roles.map((role) => (
                                    <Badge key={role} variant="secondary" className="text-xs">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => assignRoleMutation.mutate({ userId: user.user_id, role: selectedRole })}
                                disabled={assignRoleMutation.isPending || user.roles.includes(selectedRole)}
                              >
                                {assignRoleMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Add {selectedRole}
                                  </>
                                )}
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current Users with Roles */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Users with Roles
                    </h3>
                    {rolesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : usersWithRoles && usersWithRoles.length > 0 ? (
                      <div className="space-y-2">
                        {usersWithRoles.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.display_name || user.username}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={role === 'admin' ? 'default' : 'secondary'}
                                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                  onClick={() => removeRoleMutation.mutate({ userId: user.user_id, role })}
                                >
                                  {role}
                                  <XCircle className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No users with special roles yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
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
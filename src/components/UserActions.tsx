import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MoreHorizontal, Flag, Ban, MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface UserActionsProps {
  targetProfileId: string;
  targetUsername: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake or misleading profile" },
  { value: "other", label: "Other" },
];

export function UserActions({ targetProfileId, targetUsername }: UserActionsProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!user || profile?.id === targetProfileId) {
    return null;
  }

  const handleReport = async () => {
    if (!profile?.id || !reportReason) {
      toast.error("Please select a reason");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: profile.id,
      reported_id: targetProfileId,
      reason: reportReason,
      description: reportDescription || null,
    });

    if (error) {
      toast.error("Failed to submit report");
    } else {
      toast.success("Report submitted. We'll review it shortly.");
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    }
    setIsLoading(false);
  };

  const handleBlock = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    const { error } = await supabase.from("user_blocks").insert({
      blocker_id: profile.id,
      blocked_id: targetProfileId,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("User already blocked");
      } else {
        toast.error("Failed to block user");
      }
    } else {
      toast.success(`Blocked @${targetUsername}`);
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    }
    setShowBlockDialog(false);
    setIsLoading(false);
  };

  const handleMessage = () => {
    navigate(`/messages/new/${targetProfileId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-yellow-600">
            <Flag className="w-4 h-4 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive">
            <Ban className="w-4 h-4 mr-2" />
            Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report @{targetUsername}</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong. We'll review your report and take action if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value}>{reason.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more context..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={isLoading || !reportReason}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{targetUsername}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to message you, and you won't see their content in your feed.
              You can unblock them later from your settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
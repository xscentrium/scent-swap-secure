import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  url: string;
  title: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ShareButton = ({ url, title, variant = 'outline', size = 'sm' }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Share this link</p>
            <div className="flex gap-2">
              <Input value={fullUrl} readOnly className="text-xs" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="icon"
              variant="outline"
              onClick={() => window.open(shareLinks.twitter, '_blank')}
              title="Share on Twitter"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => window.open(shareLinks.facebook, '_blank')}
              title="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => window.open(shareLinks.whatsapp, '_blank')}
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

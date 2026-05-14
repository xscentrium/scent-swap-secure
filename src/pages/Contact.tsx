import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { SEO } from "@/components/SEO";
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Clock, MessageSquare, HelpCircle, Send, Loader2 } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

const faqItems = [
  {
    question: "How do I start a trade?",
    answer: "Browse the marketplace and find a fragrance you're interested in. Click 'Propose Trade' on listings marked for trade. You can then select fragrances from your collection to offer and add any additional details. The other user will receive a notification and can accept, counter, or decline your offer."
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes! We use Stripe for all payment processing, which is PCI-DSS compliant. We never store your full credit card details on our servers. All transactions are encrypted and protected by industry-standard security measures."
  },
  {
    question: "How does ID verification work?",
    answer: "ID verification is optional but recommended for building trust. Go to Settings > ID Verification and upload a government-issued ID. Our team reviews submissions within 24-48 hours. Once verified, you'll receive a verification badge on your profile and a boost to your trust score."
  },
  {
    question: "How is my trust score calculated?",
    answer: "Your trust score is based on several factors: completed trades, ratings from other users, account verification status, and trading history. Each successful trade and positive review increases your score. Cancelled trades or negative reviews may decrease it."
  },
  {
    question: "Can I sell fragrances for cash?",
    answer: "Yes! When creating a listing, you can choose 'For Sale' to set a price, 'For Trade' to exchange with other users, or 'Both' to accept either. Buyers can purchase directly through our secure checkout, and funds are transferred to your account after the buyer confirms receipt."
  },
  {
    question: "What happens if a trade goes wrong?",
    answer: "If you encounter issues with a trade, first try to resolve it directly with the other user through our messaging system. If that doesn't work, contact our support team with details of the issue. We'll mediate and help find a fair resolution. For trades involving escrow, funds are held until both parties confirm completion."
  },
  {
    question: "How do I share my collection publicly?",
    answer: "Your collection can be shared via a unique link. Go to your profile, click on your collection, and use the 'Share' button to get a public link. You can also enable/disable public visibility for your collection and wishlist in Settings > Privacy."
  },
  {
    question: "What are samples and decants?",
    answer: "Samples are small amounts of fragrance typically provided by brands, while decants are portions taken from full bottles. Our platform lets you track both separately in your Sample & Decant Tracker, including size, source, and notes."
  }
];

const Contact = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.display_name || '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('support_tickets').insert({
        profile_id: profile?.id || null,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We've received your message and will respond within 24-48 hours.",
      });

      setFormData({
        name: profile?.display_name || '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Support | Xscentrium"
        description="Reach the Xscentrium team for support, partnerships, or media inquiries."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Xscentrium",
          url: "https://xscentrium.com/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Xscentrium",
            url: "https://xscentrium.com/",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              availableLanguage: "English",
            },
          },
        }}
      />
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-serif font-bold mb-2">Contact & Support</h1>
            <p className="text-muted-foreground">We're here to help with any questions or concerns</p>
          </div>

          {/* Response Time Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">24-48 hour response</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Critical Issues</p>
                  <p className="text-sm text-muted-foreground">Same day priority</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-success/10">
                  <MessageSquare className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-medium">Trade Disputes</p>
                  <p className="text-sm text-muted-foreground">Within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send us a message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      disabled={isSubmitting}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="trading">Trading Issue</SelectItem>
                        <SelectItem value="account">Account Help</SelectItem>
                        <SelectItem value="payment">Payment Question</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="dispute">Trade Dispute</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your question or issue in detail..."
                      rows={5}
                      disabled={isSubmitting}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length}/2000 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

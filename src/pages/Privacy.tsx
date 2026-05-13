import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: May 13, 2026 · Questions? <a href="mailto:support@xscentrium.com" className="text-primary hover:underline">support@xscentrium.com</a></p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Xscentrium ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  fragrance trading platform.
                </p>
                <p>
                  Please read this privacy policy carefully. If you do not agree with the terms of this privacy 
                  policy, please do not access the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4 className="font-semibold">Personal Information</h4>
                <p>We collect information that you provide directly to us, including:</p>
                <ul>
                  <li>Account information (username, email address, password)</li>
                  <li>Profile information (display name, bio, avatar)</li>
                  <li>Date of birth (for age verification and guardian requirements)</li>
                  <li>Social media links (optional)</li>
                  <li>Identity documents (for verification purposes)</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold">Transaction Data</h4>
                <p>When you use the Platform, we collect:</p>
                <ul>
                  <li>Listing information (fragrance details, prices, images)</li>
                  <li>Trade history and transaction details</li>
                  <li>Messages exchanged with other users</li>
                  <li>Ratings and reviews</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold">Collection & Usage Data</h4>
                <p>To provide personalized features, we collect:</p>
                <ul>
                  <li>Fragrance collection items</li>
                  <li>Wishlist items</li>
                  <li>Scent of the Day (SOTD) logs</li>
                  <li>Fragrance reviews and ratings</li>
                  <li>Scent preferences and quiz responses</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold">Automatically Collected Information</h4>
                <ul>
                  <li>Device information (browser type, operating system)</li>
                  <li>Log data (IP address, access times, pages viewed)</li>
                  <li>Search queries and analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Provide, maintain, and improve the Platform</li>
                  <li>Process transactions and facilitate trades between users</li>
                  <li>Verify user identities and prevent fraud</li>
                  <li>Calculate and display trust scores</li>
                  <li>Send notifications about trades, messages, and account activity</li>
                  <li>Provide personalized fragrance recommendations</li>
                  <li>Generate usage analytics and insights (e.g., Year in Review)</li>
                  <li>Match users for potential trades based on collections and wishlists</li>
                  <li>Respond to support requests</li>
                  <li>Enforce our Terms of Service</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4 className="font-semibold">Public Information</h4>
                <p>The following information is publicly visible to other users:</p>
                <ul>
                  <li>Username and display name</li>
                  <li>Profile picture and bio</li>
                  <li>Active listings</li>
                  <li>Trust score and completed trade count</li>
                  <li>Public collection (if sharing is enabled)</li>
                  <li>Reviews you have written</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold">Private Information</h4>
                <p>We do NOT share the following with other users or third parties:</p>
                <ul>
                  <li>Your email address</li>
                  <li>Date of birth</li>
                  <li>Identity documents</li>
                  <li>Guardian information</li>
                </ul>

                <Separator className="my-4" />

                <h4 className="font-semibold">Third-Party Service Providers</h4>
                <p>We may share information with service providers who assist us in:</p>
                <ul>
                  <li>Payment processing (Stripe)</li>
                  <li>Email delivery</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Cloud storage and hosting</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use cookies and similar technologies to:</p>
                <ul>
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences (theme, notification settings)</li>
                  <li>Analyze usage patterns and improve the Platform</li>
                </ul>
                <p>
                  You can control cookie preferences through your browser settings or our cookie consent 
                  banner. Disabling certain cookies may affect Platform functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We retain your information for as long as:</p>
                <ul>
                  <li>Your account is active</li>
                  <li>Necessary to provide services to you</li>
                  <li>Required by law (e.g., financial records)</li>
                  <li>Needed to resolve disputes or enforce agreements</li>
                </ul>
                <p>
                  After account deletion, we may retain anonymized data for analytics purposes.
                  Identity verification documents are deleted within 30 days of verification completion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Depending on your location, you may have the right to:</p>

                <h4 className="font-semibold mt-4">Under GDPR (EU/EEA Residents)</h4>
                <ul>
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your data ("right to be forgotten")</li>
                  <li>Restrict processing of your data</li>
                  <li>Data portability</li>
                  <li>Object to processing</li>
                </ul>

                <h4 className="font-semibold mt-4">Under CCPA (California Residents)</h4>
                <ul>
                  <li>Know what personal information is collected</li>
                  <li>Know if personal information is sold or disclosed</li>
                  <li>Say no to the sale of personal information</li>
                  <li>Request deletion of personal information</li>
                  <li>Non-discrimination for exercising your rights</li>
                </ul>

                <p className="mt-4">
                  To exercise these rights, please contact us at support@xscentrium.com or through our 
                  contact form.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  The Platform is not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13.
                </p>
                <p>
                  Users between 13 and 16 years of age may use the Platform only with a verified 
                  guardian account. Guardian verification requires the guardian to confirm their 
                  relationship and consent to the minor's use of the Platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We implement appropriate technical and organizational measures to protect your 
                  personal information, including:
                </p>
                <ul>
                  <li>Encryption of data in transit (HTTPS)</li>
                  <li>Secure password hashing</li>
                  <li>Row-level security for database access</li>
                  <li>Regular security audits</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet is 100% secure. We cannot 
                  guarantee absolute security of your data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last 
                  updated" date.
                </p>
                <p>
                  Your continued use of the Platform after any changes indicates acceptance of 
                  the updated Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  If you have questions or concerns about this Privacy Policy, please contact us:
                </p>
                <ul>
                  <li>Email: privacy@xscentrium.com</li>
                  <li>Contact Form: <a href="/contact" className="text-primary hover:underline">/contact</a></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  By accessing or using Xscentrium ("the Platform"), you agree to be bound by these Terms of Service 
                  ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
                </p>
                <p>
                  We reserve the right to modify these Terms at any time. Your continued use of the Platform after 
                  any changes constitutes acceptance of the new Terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Xscentrium is a fragrance trading and marketplace platform that enables users to:
                </p>
                <ul>
                  <li>List fragrances for sale or trade</li>
                  <li>Browse and purchase fragrances from other users</li>
                  <li>Propose and complete fragrance trades</li>
                  <li>Track personal fragrance collections and wishlists</li>
                  <li>Connect with other fragrance enthusiasts</li>
                  <li>Access fragrance information and recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  To use certain features of the Platform, you must create an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
                <p>
                  Users under 16 years of age require a verified guardian account to use the Platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Trading Rules</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  When participating in trades on the Platform, you agree to:
                </p>
                <ul>
                  <li>Accurately describe the condition and authenticity of your fragrances</li>
                  <li>Ship items within the agreed timeframe after trade confirmation</li>
                  <li>Use appropriate packaging to protect fragrance bottles during shipping</li>
                  <li>Communicate promptly with your trading partner</li>
                  <li>Complete trades in good faith</li>
                </ul>
                <Separator className="my-4" />
                <h4 className="font-semibold">Escrow System</h4>
                <p>
                  For trades involving cash balance, escrow deposits may be required to protect both parties. 
                  Escrow funds are released upon mutual confirmation of trade completion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Prohibited Conduct</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>You may not:</p>
                <ul>
                  <li>List or trade counterfeit fragrances</li>
                  <li>Misrepresent the condition, authenticity, or origin of items</li>
                  <li>Engage in fraudulent transactions or scams</li>
                  <li>Harass, abuse, or threaten other users</li>
                  <li>Create multiple accounts to circumvent restrictions</li>
                  <li>Manipulate trust scores or ratings</li>
                  <li>Use the Platform for any illegal purpose</li>
                  <li>Attempt to circumvent Platform security measures</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Trust Score System</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  The Platform maintains a trust score system to help users make informed decisions about 
                  trading partners. Trust scores are calculated based on:
                </p>
                <ul>
                  <li>Completed trades</li>
                  <li>User ratings and reviews</li>
                  <li>Account verification status</li>
                  <li>Trade history</li>
                </ul>
                <p>
                  Manipulation of trust scores through fake accounts or fraudulent reviews is strictly 
                  prohibited and will result in account termination.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We reserve the right to suspend or terminate your account at any time for violations of 
                  these Terms, including but not limited to:
                </p>
                <ul>
                  <li>Fraudulent activity or scam attempts</li>
                  <li>Repeated trading of counterfeit items</li>
                  <li>Harassment of other users</li>
                  <li>Violation of any applicable laws</li>
                </ul>
                <p>
                  You may also request account deletion by contacting our support team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR:
                </p>
                <ul>
                  <li>The accuracy of user-provided information</li>
                  <li>The authenticity of items listed by users</li>
                  <li>Disputes between users regarding trades</li>
                  <li>Loss or damage during shipping</li>
                  <li>Any indirect, incidental, or consequential damages</li>
                </ul>
                <p>
                  Xscentrium acts as a platform to facilitate transactions between users and is not a party 
                  to any trade or sale.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  In the event of a dispute between users, we encourage resolution through direct communication. 
                  If resolution cannot be reached, you may contact our support team for mediation assistance.
                </p>
                <p>
                  Any legal disputes arising from these Terms or use of the Platform shall be resolved through 
                  binding arbitration in accordance with applicable law.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  For questions about these Terms of Service, please contact us at:
                </p>
                <ul>
                  <li>Email: support@xscentrium.com</li>
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

export default Terms;

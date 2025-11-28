import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Share2, UserCog, Globe, Mail } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const tableOfContents: TableOfContentsItem[] = [
  { id: 'information-we-collect', title: 'Information We Collect', icon: <Database className="w-4 h-4" /> },
  { id: 'how-we-use-information', title: 'How We Use Information', icon: <UserCog className="w-4 h-4" /> },
  { id: 'data-sharing', title: 'Data Sharing & Third Parties', icon: <Share2 className="w-4 h-4" /> },
  { id: 'your-rights', title: 'Your Rights (GDPR)', icon: <Shield className="w-4 h-4" /> },
  { id: 'data-retention', title: 'Data Retention', icon: <Database className="w-4 h-4" /> },
  { id: 'international-transfers', title: 'International Transfers', icon: <Globe className="w-4 h-4" /> },
  { id: 'contact', title: 'Contact Us', icon: <Mail className="w-4 h-4" /> },
];

function PrivacyPolicy() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: November 28, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Introduction */}
        <div className="mb-8">
          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy explains how TribeUp ("we", "us", or "our") collects, uses, and protects 
            your personal information when you use our sports activity coordination platform. We are 
            committed to protecting your privacy and handling your data in an open and transparent manner.
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <nav aria-label="Privacy policy sections">
              <ul className="space-y-2">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          {/* Information We Collect */}
          <section id="information-we-collect" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Database className="w-5 h-5" />
              Information We Collect
            </h2>
            <p>We collect information that you provide directly to us, as well as information that is collected automatically when you use our service.</p>
            
            <h3 className="text-lg font-medium mt-4">Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Email address, name, username, and password when you create an account</li>
              <li><strong>Profile Information:</strong> Bio, avatar, preferred sports, skill levels, and location preferences</li>
              <li><strong>Game Data:</strong> Games you create, join, or participate in, including dates, times, and locations</li>
              <li><strong>Communications:</strong> Messages, comments, and feedback you send through our platform</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> How you interact with our app, including features used and time spent</li>
              <li><strong>Device Information:</strong> Device type, operating system, and browser type</li>
              <li><strong>Location Data:</strong> Your location when you enable location services (used to find nearby games)</li>
              <li><strong>Log Data:</strong> IP address, access times, and error logs for debugging purposes</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section id="how-we-use-information" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <UserCog className="w-5 h-5" />
              How We Use Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li><strong>Provide Core Services:</strong> Enable you to create, discover, and join sports activities</li>
              <li><strong>Personalize Experience:</strong> Show relevant games based on your preferences and location</li>
              <li><strong>Send Notifications:</strong> Game reminders, messages from other users, and important updates</li>
              <li><strong>Improve Our Service:</strong> Analyze usage patterns to enhance features and user experience</li>
              <li><strong>Ensure Safety:</strong> Detect and prevent fraud, abuse, and violations of our terms</li>
              <li><strong>Communicate:</strong> Respond to your inquiries and provide customer support</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section id="data-sharing" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Share2 className="w-5 h-5" />
              Data Sharing & Third Parties
            </h2>
            <p>
              <strong>We do not sell your personal information.</strong> We may share your data in the following limited circumstances:
            </p>
            <ul>
              <li><strong>With Other Users:</strong> Your public profile, games you create, and participation information is visible to other users</li>
              <li><strong>Service Providers:</strong> We use trusted third-party services to operate our platform:
                <ul>
                  <li>Supabase (database and authentication)</li>
                  <li>Google Maps (location services)</li>
                  <li>WeatherAPI (weather information for games)</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p>All third-party service providers are bound by data processing agreements that require them to protect your information.</p>
          </section>

          {/* Your Rights (GDPR) */}
          <section id="your-rights" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Shield className="w-5 h-5" />
              Your Rights (GDPR)
            </h2>
            <p>Under the General Data Protection Regulation (GDPR) and similar laws, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              <strong>How to Exercise Your Rights:</strong>
            </p>
            <ul>
              <li>Manage your profile and preferences in <Link to="/app/settings" className="text-primary hover:underline">Settings</Link></li>
              <li>Control notification preferences in <Link to="/app/settings/notifications" className="text-primary hover:underline">Notification Settings</Link></li>
              <li>Request data export or account deletion by contacting support</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Database className="w-5 h-5" />
              Data Retention
            </h2>
            <p>We retain your personal data only for as long as necessary to:</p>
            <ul>
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p>
              When you delete your account, we will delete or anonymize your personal data within 30 days, 
              except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          {/* International Transfers */}
          <section id="international-transfers" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Globe className="w-5 h-5" />
              International Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data, including standard 
              contractual clauses and other approved transfer mechanisms.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Mail className="w-5 h-5" />
              Contact Us
            </h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:support@tribeup.fit" className="text-primary hover:underline">support@tribeup.fit</a></li>
              <li><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@tribeup.fit" className="text-primary hover:underline">privacy@tribeup.fit</a></li>
            </ul>
            <p className="mt-4">
              We will respond to your inquiry within 30 days. For GDPR-related requests, 
              we will respond within the legally required timeframe.
            </p>
          </section>

          {/* Updates to This Policy */}
          <section className="mt-8 pt-6 border-t border-border">
            <h2 className="text-lg font-semibold">Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes by posting the new policy on this page and updating the 
              "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Related Links */}
          <section className="mt-8 pt-6 border-t border-border">
            <h2 className="text-lg font-semibold mb-4">Related Documents</h2>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/legal/terms" 
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Terms of Service
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;

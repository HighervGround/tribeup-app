import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

function TermsOfService() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
          <h1 className="text-xl font-semibold">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Table of Contents */}
        <nav className="mb-8 p-4 bg-muted/50 rounded-lg" aria-label="Table of contents">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Table of Contents</h2>
          <ol className="space-y-2 text-sm">
            <li>
              <button onClick={() => scrollToSection('acceptance')} className="text-primary hover:underline text-left">
                1. Acceptance of Terms
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('eligibility')} className="text-primary hover:underline text-left">
                2. Eligibility
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('account')} className="text-primary hover:underline text-left">
                3. Account Registration
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('use-of-service')} className="text-primary hover:underline text-left">
                4. Use of Service
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('user-content')} className="text-primary hover:underline text-left">
                5. User Content
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('prohibited-conduct')} className="text-primary hover:underline text-left">
                6. Prohibited Conduct
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('games-events')} className="text-primary hover:underline text-left">
                7. Games and Events
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('intellectual-property')} className="text-primary hover:underline text-left">
                8. Intellectual Property
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('termination')} className="text-primary hover:underline text-left">
                9. Termination
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('disclaimers')} className="text-primary hover:underline text-left">
                10. Disclaimers
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('limitation')} className="text-primary hover:underline text-left">
                11. Limitation of Liability
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('disputes')} className="text-primary hover:underline text-left">
                12. Dispute Resolution
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('changes')} className="text-primary hover:underline text-left">
                13. Changes to Terms
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('contact')} className="text-primary hover:underline text-left">
                14. Contact Us
              </button>
            </li>
          </ol>
        </nav>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">Last updated: November 28, 2025</p>
          
          <p className="text-muted-foreground italic">
            ⚠️ Note: This document contains placeholder legal language and should be reviewed by legal counsel before official use.
          </p>

          <section id="acceptance" className="scroll-mt-20">
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to TribeUp! By accessing or using our platform, mobile application, or any associated services 
              (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not 
              agree to these Terms, please do not use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and TribeUp. Your continued use of the 
              Service following any changes to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          <section id="eligibility" className="scroll-mt-20">
            <h2>2. Eligibility</h2>
            <p>To use TribeUp, you must:</p>
            <ul>
              <li>Be at least 13 years of age (or the minimum age required in your jurisdiction)</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
            <p>
              If you are under 18 years of age, you represent that you have your parent or guardian's permission to 
              use the Service and that they have agreed to these Terms on your behalf.
            </p>
          </section>

          <section id="account" className="scroll-mt-20">
            <h2>3. Account Registration</h2>
            <p>
              To access certain features of the Service, you must create an account. When creating an account, you agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p>
              You may not use another person's account without permission. We reserve the right to suspend or 
              terminate accounts that contain false or misleading information.
            </p>
          </section>

          <section id="use-of-service" className="scroll-mt-20">
            <h2>4. Use of Service</h2>
            <p>
              TribeUp provides a platform for users to discover, organize, and participate in sports activities 
              and recreational events. You may use the Service to:
            </p>
            <ul>
              <li>Create and manage sports games and activities</li>
              <li>Join games and activities organized by other users</li>
              <li>Connect with other sports enthusiasts</li>
              <li>Create and join Tribes (community groups)</li>
              <li>Communicate with other users through the platform</li>
            </ul>
            <p>
              You agree to use the Service only for its intended purposes and in compliance with all applicable laws and regulations.
            </p>
          </section>

          <section id="user-content" className="scroll-mt-20">
            <h2>5. User Content</h2>
            <p>
              You retain ownership of any content you submit, post, or display on or through the Service ("User Content"). 
              By submitting User Content, you grant TribeUp a non-exclusive, worldwide, royalty-free license to use, copy, 
              modify, display, and distribute your User Content in connection with operating and providing the Service.
            </p>
            <p>You represent and warrant that:</p>
            <ul>
              <li>You own or have the right to use and authorize the use of your User Content</li>
              <li>Your User Content does not violate any third party's rights, including intellectual property rights</li>
              <li>Your User Content complies with these Terms and all applicable laws</li>
            </ul>
            <p>
              We reserve the right to remove any User Content that violates these Terms or that we deem inappropriate, 
              without prior notice.
            </p>
          </section>

          <section id="prohibited-conduct" className="scroll-mt-20">
            <h2>6. Prohibited Conduct</h2>
            <p>When using TribeUp, you agree NOT to:</p>
            <ul>
              <li>Harass, bully, intimidate, or threaten other users</li>
              <li>Post content that is discriminatory, hateful, or promotes violence</li>
              <li>Impersonate others or misrepresent your identity or affiliation</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Spam, solicit, or send unsolicited communications</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload viruses, malware, or other harmful code</li>
              <li>Collect or harvest user information without consent</li>
              <li>Use automated systems or bots to access the Service</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section id="games-events" className="scroll-mt-20">
            <h2>7. Games and Events</h2>
            <p>
              TribeUp facilitates connections between users for sports activities. When organizing or participating 
              in games and events:
            </p>
            <ul>
              <li>Game organizers are responsible for providing accurate event information</li>
              <li>Participants are responsible for assessing their own fitness and ability to participate safely</li>
              <li>All users participate in activities at their own risk</li>
              <li>TribeUp is not responsible for the conduct of any user at games or events</li>
              <li>Games cannot be modified within 2 hours of their scheduled start time</li>
            </ul>
            <p>
              We encourage all users to communicate clearly about skill levels, equipment requirements, and safety 
              considerations before participating in any activity.
            </p>
          </section>

          <section id="intellectual-property" className="scroll-mt-20">
            <h2>8. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding User Content), features, and functionality are owned 
              by TribeUp and are protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of the Service, nor may you reverse 
              engineer or attempt to extract the source code of the software.
            </p>
          </section>

          <section id="termination" className="scroll-mt-20">
            <h2>9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service immediately, without prior notice or liability, 
              for any reason, including if you breach these Terms.
            </p>
            <p>
              You may terminate your account at any time by contacting us or using the account deletion feature 
              in your settings. Upon termination:
            </p>
            <ul>
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and User Content</li>
              <li>Provisions that by their nature should survive will remain in effect</li>
            </ul>
          </section>

          <section id="disclaimers" className="scroll-mt-20">
            <h2>10. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free. We do not make 
              any warranties regarding the accuracy, reliability, or availability of the Service.
            </p>
            <p>
              TribeUp is a platform that connects users and is not responsible for the actions, content, 
              information, or data of third parties or other users.
            </p>
          </section>

          <section id="limitation" className="scroll-mt-20">
            <h2>11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRIBEUP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, data, or use</li>
              <li>Personal injury or property damage arising from your participation in activities</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid us, if any, in the past twelve months.
            </p>
          </section>

          <section id="disputes" className="scroll-mt-20">
            <h2>12. Dispute Resolution</h2>
            <p>
              Any disputes arising from or relating to these Terms or the Service shall be resolved through:
            </p>
            <ol>
              <li><strong>Informal Resolution:</strong> You agree to first attempt to resolve any dispute informally by contacting us.</li>
              <li><strong>Binding Arbitration:</strong> If the dispute cannot be resolved informally, it shall be resolved through binding arbitration in accordance with applicable arbitration rules.</li>
            </ol>
            <p>
              You agree to resolve disputes on an individual basis and waive the right to participate in a 
              class action lawsuit or class-wide arbitration.
            </p>
          </section>

          <section id="changes" className="scroll-mt-20">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of material changes 
              by updating the "Last updated" date and, where appropriate, through additional notification methods.
            </p>
            <p>
              Your continued use of the Service after changes become effective constitutes your acceptance of the 
              revised Terms. If you do not agree to the new Terms, you must stop using the Service.
            </p>
          </section>

          <section id="contact" className="scroll-mt-20">
            <h2>14. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: <a href="mailto:support@tribeup.app" className="text-primary hover:underline">support@tribeup.app</a></li>
            </ul>
          </section>

          {/* Related Links */}
          <section className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Related Documents</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;

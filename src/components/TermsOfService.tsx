import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Terms of Service</h1>
        </div>
      </div>

      <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
        <p>Last updated: August 28, 2025</p>
        <p>
          By using TribeUp, you agree to these Terms of Service. If you do not agree, do not use the app.
        </p>
        <h2>Use of Service</h2>
        <ul>
          <li>You must be 13 years or older to use the service.</li>
          <li>You are responsible for any content you post and your interactions with other users.</li>
          <li>Do not engage in harassment, abuse, or illegal activities.</li>
        </ul>
        <h2>Content</h2>
        <p>
          You retain ownership of your content. By posting, you grant TribeUp a limited license to display and operate the service.
        </p>
        <h2>Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms.
        </p>
        <h2>Disclaimers</h2>
        <p>
          The service is provided "as is" without warranties. We are not liable for damages arising from use of the service.
        </p>
        <h2>Contact</h2>
        <p>Questions? Contact support at support@tribeup.app</p>
      </div>
    </div>
  );
}

export default TermsOfService;

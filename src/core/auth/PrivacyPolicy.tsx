import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
        <p>Last updated: August 28, 2025</p>
        <p>
          This Privacy Policy explains how TribeUp collects, uses, and shares information about you
          when you use our app. We only collect the minimum data necessary to operate the service.
        </p>
        <h2>Information We Collect</h2>
        <ul>
          <li>Account information (email, name, username)</li>
          <li>Profile information you provide (bio, avatar, preferred sports, location)</li>
          <li>Usage data for improving the app (crash logs, feature usage)</li>
        </ul>
        <h2>How We Use Information</h2>
        <ul>
          <li>Provide and improve core features (profiles, games, messaging)</li>
          <li>Send important notifications you opt into (game reminders, messages)</li>
          <li>Maintain security and prevent abuse</li>
        </ul>
        <h2>Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share data with service providers strictly
          to operate the app (e.g., hosting, analytics) under appropriate data processing agreements.
        </p>
        <h2>Your Choices</h2>
        <ul>
          <li>Manage notification preferences in Settings</li>
          <li>Control profile visibility and location sharing in Settings</li>
          <li>Request data export or deletion by contacting support</li>
        </ul>
        <h2>Contact</h2>
        <p>Questions? Contact support at support@tribeup.app</p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;

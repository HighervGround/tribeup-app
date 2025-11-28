import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { 
  Download, 
  FileJson, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Info 
} from 'lucide-react';
import { exportUserData, downloadDataAsJson } from '@/domains/users/services/dataExport';
import { toast } from 'sonner';

interface DataExportSectionProps {
  className?: string;
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

// Constants for timing
const PROGRESS_ANIMATION_DELAY_MS = 300;
const STATUS_RESET_DELAY_MS = 3000;

export function DataExportSection({ className }: DataExportSectionProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus('exporting');
    setProgress(0);
    setErrorMessage(null);

    try {
      // Simulate progress for better UX (actual fetch is quick)
      setProgress(20);
      
      const data = await exportUserData();
      setProgress(80);

      // Small delay to show progress animation completing
      await new Promise(resolve => setTimeout(resolve, PROGRESS_ANIMATION_DELAY_MS));
      setProgress(100);

      // Download the JSON file
      downloadDataAsJson(data);
      
      setStatus('success');
      toast.success('Your data has been exported successfully!');

      // Reset status after a few seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, STATUS_RESET_DELAY_MS);
    } catch (error) {
      console.error('Data export failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
      toast.error('Failed to export data. Please try again.');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Download Your Data
        </CardTitle>
        <CardDescription>
          Export all your personal data in a machine-readable format (JSON). This includes your profile, games, tribes, messages, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Information about what's included */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Your export will include:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Profile information (name, email, bio, preferences)</li>
              <li>Games you've created</li>
              <li>Games you've joined</li>
              <li>Tribes you've created or joined</li>
              <li>Chat messages</li>
              <li>Notifications</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Progress indicator when exporting */}
        {status === 'exporting' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing your data export...
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your data has been downloaded successfully! Check your downloads folder.
            </AlertDescription>
          </Alert>
        )}

        {/* Error state */}
        {status === 'error' && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={status === 'exporting'}
          className="w-full"
          size="lg"
        >
          {status === 'exporting' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download My Data
            </>
          )}
        </Button>

        {/* Format info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <FileJson className="w-3 h-3" />
          <span>Data will be downloaded as a JSON file</span>
        </div>

        {/* GDPR compliance note */}
        <p className="text-xs text-muted-foreground text-center">
          In accordance with GDPR Article 20, you have the right to receive your personal data in a structured, commonly used, and machine-readable format.
        </p>
      </CardContent>
    </Card>
  );
}

export default DataExportSection;

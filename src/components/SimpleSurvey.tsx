import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, CheckCircle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

interface SimpleSurveyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleSurvey({ isOpen, onClose }: SimpleSurveyProps) {
  const [formData, setFormData] = useState({
    tester_name: '',
    device_browser: '',
    feedback: '',
    rating: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      toast.success('Thank you! Your feedback has been submitted.');
      
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({ tester_name: '', device_browser: '', feedback: '', rating: '' });
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Thank You!</h3>
            <p className="text-muted-foreground">
              Your feedback has been recorded and will help improve TribeUp.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              TribeUp User Testing Survey
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your name or initials *</label>
                <Input
                  value={formData.tester_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, tester_name: e.target.value }))}
                  placeholder="Enter your name or initials"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Device/Browser *</label>
                <Select 
                  value={formData.device_browser} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, device_browser: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select device and browser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop_chrome">Desktop - Chrome</SelectItem>
                    <SelectItem value="desktop_safari">Desktop - Safari</SelectItem>
                    <SelectItem value="mobile_ios">Mobile - iOS Safari</SelectItem>
                    <SelectItem value="mobile_android">Mobile - Android Chrome</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Overall Experience *</label>
                <Select 
                  value={formData.rating} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate your experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Good</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Average</SelectItem>
                    <SelectItem value="2">⭐⭐ Poor</SelectItem>
                    <SelectItem value="1">⭐ Very Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Feedback & Suggestions</label>
                <Textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Share your thoughts about TribeUp - what worked well, what was confusing, what features are missing..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isSubmitting || !formData.tester_name || !formData.device_browser || !formData.rating}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { X, CheckCircle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { SupabaseService } from '../lib/supabaseService';
import { toast } from 'sonner';

interface UserTestingSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: 'onboarding' | 'game_creation' | 'game_join' | 'general';
}

interface SurveyData {
  tester_name: string;
  device_browser: string;
  session_duration: string;
  signup_success: string;
  signup_method: string[];
  create_game: string;
  join_game: string;
  onboarding_rating: number;
  game_creation_rating: number;
  navigation_rating: number;
  performance_rating: number;
  technical_issues: string[];
  bug_details: string;
  positive_feedback: string;
  confusion_feedback: string;
  missing_features: string;
  likelihood_rating: number;
  additional_comments: string;
  trigger_context: string;
}

export function UserTestingSurvey({ isOpen, onClose, triggerContext = 'general' }: UserTestingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Partial<SurveyData>>({
    trigger_context: triggerContext,
    signup_method: [],
    technical_issues: []
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof SurveyData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayUpdate = (field: 'signup_method' | 'technical_issues', value: string, checked: boolean) => {
    const currentArray = formData[field] || [];
    if (checked) {
      updateFormData(field, [...currentArray, value]);
    } else {
      updateFormData(field, currentArray.filter(item => item !== value));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create the survey data object
      const surveyData = {
        ...formData,
        signup_method: formData.signup_method?.join(',') || '',
        technical_issues: formData.technical_issues?.join(',') || '',
        submitted_at: new Date().toISOString()
      };

      // Store in Supabase (you'll need to create this table)
      await SupabaseService.submitUserTestingFeedback(surveyData);
      
      setIsSubmitted(true);
      toast.success('Thank you! Your feedback has been submitted.');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setCurrentStep(1);
        setFormData({ trigger_context: triggerContext, signup_method: [], technical_issues: [] });
      }, 3000);
      
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingScale = ({ name, value, onChange, required = false }: {
    name: string;
    value: number;
    onChange: (value: number) => void;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
        <RadioGroup
          value={value?.toString()}
          onValueChange={(val) => onChange(parseInt(val))}
          className="flex gap-4"
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex flex-col items-center space-y-1">
              <RadioGroupItem value={num.toString()} id={`${name}-${num}`} />
              <Label htmlFor={`${name}-${num}`} className="text-sm">{num}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps} • Help us improve your experience
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Testing Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tester_name">Your name or initials *</Label>
                  <Input
                    id="tester_name"
                    value={formData.tester_name || ''}
                    onChange={(e) => updateFormData('tester_name', e.target.value)}
                    placeholder="Enter your name or initials"
                  />
                </div>
                
                <div>
                  <Label htmlFor="device_browser">Device/Browser used *</Label>
                  <Select value={formData.device_browser} onValueChange={(value) => updateFormData('device_browser', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device and browser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop_chrome">Desktop - Chrome</SelectItem>
                      <SelectItem value="desktop_safari">Desktop - Safari</SelectItem>
                      <SelectItem value="desktop_firefox">Desktop - Firefox</SelectItem>
                      <SelectItem value="mobile_ios_safari">Mobile - iOS Safari</SelectItem>
                      <SelectItem value="mobile_android_chrome">Mobile - Android Chrome</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="session_duration">Testing session duration</Label>
                  <Input
                    id="session_duration"
                    value={formData.session_duration || ''}
                    onChange={(e) => updateFormData('session_duration', e.target.value)}
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Task Completion */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>✅ Task Completion Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Were you able to successfully sign up for TribeUp? *</Label>
                  <RadioGroup
                    value={formData.signup_success}
                    onValueChange={(value) => updateFormData('signup_success', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="signup_yes" />
                      <Label htmlFor="signup_yes">Yes, completed successfully</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="signup_partial" />
                      <Label htmlFor="signup_partial">Partially (encountered issues)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="signup_no" />
                      <Label htmlFor="signup_no">No, could not complete</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Which signup method did you use?</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email_pass"
                        checked={formData.signup_method?.includes('email_password')}
                        onCheckedChange={(checked) => handleArrayUpdate('signup_method', 'email_password', checked as boolean)}
                      />
                      <Label htmlFor="email_pass">Email/Password</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="google_oauth"
                        checked={formData.signup_method?.includes('google_oauth')}
                        onCheckedChange={(checked) => handleArrayUpdate('signup_method', 'google_oauth', checked as boolean)}
                      />
                      <Label htmlFor="google_oauth">Google OAuth</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Were you able to create a new game? *</Label>
                  <RadioGroup
                    value={formData.create_game}
                    onValueChange={(value) => updateFormData('create_game', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="create_yes" />
                      <Label htmlFor="create_yes">Yes, successfully created</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="create_partial" />
                      <Label htmlFor="create_partial">Started but didn't finish</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="create_no" />
                      <Label htmlFor="create_no">No, couldn't create</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Experience Ratings */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>⭐ User Experience Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">How intuitive was the onboarding process? *</Label>
                  <RatingScale
                    name="onboarding"
                    value={formData.onboarding_rating || 0}
                    onChange={(value) => updateFormData('onboarding_rating', value)}
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How easy was it to create a game? *</Label>
                  <RatingScale
                    name="game_creation"
                    value={formData.game_creation_rating || 0}
                    onChange={(value) => updateFormData('game_creation_rating', value)}
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How clear was the navigation? *</Label>
                  <RatingScale
                    name="navigation"
                    value={formData.navigation_rating || 0}
                    onChange={(value) => updateFormData('navigation_rating', value)}
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How was the overall app performance? *</Label>
                  <RatingScale
                    name="performance"
                    value={formData.performance_rating || 0}
                    onChange={(value) => updateFormData('performance_rating', value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Technical Issues */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>🐛 Technical Issues & Bugs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Did you encounter any of these issues? (Check all that apply)</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      { value: 'infinite_loading', label: 'Infinite loading screens' },
                      { value: 'app_crashes', label: 'App crashes or white screens' },
                      { value: 'forms_broken', label: 'Forms not working properly' },
                      { value: 'buttons_unresponsive', label: 'Buttons not responding' },
                      { value: 'map_issues', label: 'Map not loading or working' },
                      { value: 'auth_problems', label: 'Login/signup problems' },
                      { value: 'no_issues', label: 'No technical issues encountered' }
                    ].map((issue) => (
                      <div key={issue.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={issue.value}
                          checked={formData.technical_issues?.includes(issue.value)}
                          onCheckedChange={(checked) => handleArrayUpdate('technical_issues', issue.value, checked as boolean)}
                        />
                        <Label htmlFor={issue.value}>{issue.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bug_details">Please describe any specific bugs or errors</Label>
                  <Textarea
                    id="bug_details"
                    value={formData.bug_details || ''}
                    onChange={(e) => updateFormData('bug_details', e.target.value)}
                    placeholder="Describe any technical issues, error messages, or unexpected behavior..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Feedback */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>💭 Usability Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="positive_feedback">What features did you find most useful or well-designed?</Label>
                  <Textarea
                    id="positive_feedback"
                    value={formData.positive_feedback || ''}
                    onChange={(e) => updateFormData('positive_feedback', e.target.value)}
                    placeholder="Tell us what worked well for you..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="confusion_feedback">What was the most confusing or frustrating part?</Label>
                  <Textarea
                    id="confusion_feedback"
                    value={formData.confusion_feedback || ''}
                    onChange={(e) => updateFormData('confusion_feedback', e.target.value)}
                    placeholder="Help us understand what didn't work well..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="missing_features">What features are missing that you'd expect to see?</Label>
                  <Textarea
                    id="missing_features"
                    value={formData.missing_features || ''}
                    onChange={(e) => updateFormData('missing_features', e.target.value)}
                    placeholder="What functionality would you like to see added?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Overall Assessment */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>🎯 Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">How likely would you be to use TribeUp to organize sports activities? *</Label>
                  <RatingScale
                    name="likelihood"
                    value={formData.likelihood_rating || 0}
                    onChange={(value) => updateFormData('likelihood_rating', value)}
                    required
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Very unlikely</span>
                    <span>Very likely</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional_comments">Any additional comments or suggestions?</Label>
                  <Textarea
                    id="additional_comments"
                    value={formData.additional_comments || ''}
                    onChange={(e) => updateFormData('additional_comments', e.target.value)}
                    placeholder="Share any other thoughts about your TribeUp experience..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

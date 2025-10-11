import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { ArrowLeft, CheckCircle, MessageSquare, Send, Bug, Lightbulb, Star } from 'lucide-react';
import { SupabaseService } from '../lib/supabaseService';
import { toast } from 'sonner';

interface FeedbackData {
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

function FeedbackPage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    trigger_context: 'feedback_page',
    signup_method: [],
    technical_issues: []
  });

  const totalSections = 5;
  const progress = (currentSection / totalSections) * 100;

  const updateFormData = (field: keyof FeedbackData, value: any) => {
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
      const surveyData = {
        ...formData,
        signup_method: formData.signup_method?.join(',') || '',
        technical_issues: formData.technical_issues?.join(',') || '',
        submitted_at: new Date().toISOString()
      };

      await SupabaseService.submitUserTestingFeedback(surveyData);
      
      setIsSubmitted(true);
      toast.success('Thank you! Your feedback has been submitted.');
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Feedback submission error:', error);
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
          onValueChange={(val: string) => onChange(parseInt(val))}
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been recorded and will help improve TribeUp. 
              You'll be redirected to the home page shortly.
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">Help Improve TribeUp</h1>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Section {currentSection} of {totalSections} • Your feedback helps us build a better experience
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Section 1: Basic Info */}
          {currentSection === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Tell Us About Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="tester_name">Your name or initials (optional)</Label>
                  <Input
                    id="tester_name"
                    value={formData.tester_name || ''}
                    onChange={(e) => updateFormData('tester_name', e.target.value)}
                    placeholder="Enter your name or initials"
                  />
                </div>
                
                <div>
                  <Label htmlFor="device_browser">What device and browser are you using?</Label>
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
                  <Label htmlFor="session_duration">How long have you been using TribeUp?</Label>
                  <Input
                    id="session_duration"
                    value={formData.session_duration || ''}
                    onChange={(e) => updateFormData('session_duration', e.target.value)}
                    placeholder="e.g., First time, 30 minutes, few days"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Feature Usage */}
          {currentSection === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Feature Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Were you able to successfully sign up for TribeUp?</Label>
                  <RadioGroup
                    value={formData.signup_success}
                    onValueChange={(value: string) => updateFormData('signup_success', value)}
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id="signup_na" />
                      <Label htmlFor="signup_na">Not applicable / Already had account</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Have you tried creating a game?</Label>
                  <RadioGroup
                    value={formData.create_game}
                    onValueChange={(value: string) => updateFormData('create_game', value)}
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id="create_na" />
                      <Label htmlFor="create_na">Haven't tried yet</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Have you joined any games?</Label>
                  <RadioGroup
                    value={formData.join_game}
                    onValueChange={(value: string) => updateFormData('join_game', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="join_yes" />
                      <Label htmlFor="join_yes">Yes, joined successfully</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="join_partial" />
                      <Label htmlFor="join_partial">Tried but had issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="join_no" />
                      <Label htmlFor="join_no">No, couldn't join</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id="join_na" />
                      <Label htmlFor="join_na">Haven't tried yet</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Experience Ratings */}
          {currentSection === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Rate Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">How intuitive was the onboarding process?</Label>
                  <RatingScale
                    name="onboarding"
                    value={formData.onboarding_rating || 0}
                    onChange={(value) => updateFormData('onboarding_rating', value)}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How easy was it to create a game?</Label>
                  <RatingScale
                    name="game_creation"
                    value={formData.game_creation_rating || 0}
                    onChange={(value) => updateFormData('game_creation_rating', value)}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How clear was the navigation?</Label>
                  <RatingScale
                    name="navigation"
                    value={formData.navigation_rating || 0}
                    onChange={(value) => updateFormData('navigation_rating', value)}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">How was the overall app performance?</Label>
                  <RatingScale
                    name="performance"
                    value={formData.performance_rating || 0}
                    onChange={(value) => updateFormData('performance_rating', value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Issues & Bugs */}
          {currentSection === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  Technical Issues & Bugs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      { value: 'games_not_loading', label: 'Games not loading' },
                      { value: 'join_leave_broken', label: 'Join/leave buttons not working' },
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

          {/* Section 5: Feedback & Suggestions */}
          {currentSection === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Your Feedback & Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div>
                  <Label className="text-base font-medium">How likely would you be to use TribeUp to organize sports activities?</Label>
                  <RatingScale
                    name="likelihood"
                    value={formData.likelihood_rating || 0}
                    onChange={(value) => updateFormData('likelihood_rating', value)}
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
              onClick={() => setCurrentSection(prev => Math.max(1, prev - 1))}
              disabled={currentSection === 1}
            >
              Previous
            </Button>

            {currentSection < totalSections ? (
              <Button
                onClick={() => setCurrentSection(prev => Math.min(totalSections, prev + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;

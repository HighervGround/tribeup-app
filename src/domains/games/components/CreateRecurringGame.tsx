import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, DollarSign, Repeat, Save } from 'lucide-react';
import { SupabaseService } from '@/core/database/supabaseService';
import { useAppStore } from '@/store/appStore';

interface CreateRecurringGameProps {
  onSuccess?: (templateId: string) => void;
  onCancel?: () => void;
}

export const CreateRecurringGame: React.FC<CreateRecurringGameProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    sport: 'basketball',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    cost: 'Free',
    maxPlayers: 10,
    duration: 60,
    description: '',
    imageUrl: '',
    recurrenceType: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    timeOfDay: '18:00',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    maxOccurrences: undefined as number | undefined
  });

  const sports = [
    'basketball', 'soccer', 'tennis', 'volleyball', 'baseball', 'football',
    'hockey', 'golf', 'swimming', 'running', 'cycling', 'hiking', 'other'
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to create recurring games');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a game title');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateData = {
        title: formData.title.trim(),
        sport: formData.sport,
        location: formData.location.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        cost: formData.cost,
        maxPlayers: formData.maxPlayers,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        recurrenceType: formData.recurrenceType,
        dayOfWeek: formData.recurrenceType !== 'monthly' ? formData.dayOfWeek : undefined,
        dayOfMonth: formData.recurrenceType === 'monthly' ? formData.dayOfMonth : undefined,
        timeOfDay: formData.timeOfDay,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        maxOccurrences: formData.maxOccurrences
      };

      const templateId = await SupabaseService.createRecurringTemplate(templateData);
      onSuccess?.(templateId);
    } catch (err: any) {
      setError(err.message || 'Failed to create recurring game template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Repeat className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Create Recurring Game</h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Weekly Basketball Pickup"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport *
            </label>
            <select
              value={formData.sport}
              onChange={(e) => handleInputChange('sport', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sports.map(sport => (
                <option key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Community Center Gym"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Max Players
            </label>
            <input
              type="number"
              min="2"
              max="100"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Cost
            </label>
            <select
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Free">Free</option>
              <option value="$5">$5</option>
              <option value="$10">$10</option>
              <option value="$15">$15</option>
              <option value="$20">$20</option>
              <option value="$25">$25</option>
            </select>
          </div>
        </div>

        {/* Recurrence Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recurrence Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat Pattern
              </label>
              <select
                value={formData.recurrenceType}
                onChange={(e) => handleInputChange('recurrenceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 Weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {formData.recurrenceType !== 'monthly' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={formData.timeOfDay}
                onChange={(e) => handleInputChange('timeOfDay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Occurrences (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.maxOccurrences || ''}
              onChange={(e) => handleInputChange('maxOccurrences', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty for unlimited"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alternative to end date - limit total number of games created
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Regular pickup game for all skill levels..."
          />
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
          <p className="text-sm text-blue-800">
            This will create "{formData.title}" every{' '}
            {formData.recurrenceType === 'weekly' ? 'week' : 
             formData.recurrenceType === 'biweekly' ? '2 weeks' : 'month'} on{' '}
            {formData.recurrenceType !== 'monthly' 
              ? daysOfWeek.find(d => d.value === formData.dayOfWeek)?.label
              : `the ${formData.dayOfMonth}${formData.dayOfMonth === 1 ? 'st' : formData.dayOfMonth === 2 ? 'nd' : formData.dayOfMonth === 3 ? 'rd' : 'th'}`
            } at {formData.timeOfDay}.
            {formData.endDate && ` Games will run until ${formData.endDate}.`}
            {formData.maxOccurrences && ` Limited to ${formData.maxOccurrences} total games.`}
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create Recurring Game'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

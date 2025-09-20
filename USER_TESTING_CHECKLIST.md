# TribeUp User Testing Checklist

## 🎯 Pre-Testing Setup

### **Environment Check**
- [ ] Development server running (`npm run dev`)
- [ ] App accessible at `http://localhost:3000`
- [ ] No console errors on page load
- [ ] All recent fixes applied (ratings, presence, dropdowns)

### **Test Accounts**
- [ ] Create 2-3 test user accounts for multi-user scenarios
- [ ] Test both email/password and Google OAuth signup
- [ ] Verify user profiles are created properly

---

## 👥 Core User Flows to Test

### **1. User Onboarding (5-10 minutes)**
- [ ] **Sign Up Process**
  - Email/password registration
  - Google OAuth (expect "unverified app" warning - normal)
  - Profile completion (name, sports preferences)
  - Avatar upload/selection

- [ ] **First Time Experience**
  - Onboarding flow completion
  - Sports selection working
  - Navigation to home screen
  - No infinite loading issues

### **2. Game Discovery & Creation (10-15 minutes)**
- [ ] **Browse Games**
  - Home screen loads with games
  - Search functionality works
  - Filter by sport/location
  - Map view shows games correctly

- [ ] **Create New Game**
  - Game creation form works
  - All sports available in dropdown
  - Date/time picker functional
  - Location search working
  - Weather integration showing
  - Game appears in listings after creation

### **3. Game Interaction (15-20 minutes)**
- [ ] **Join/Leave Games**
  - Join button works for available games
  - Leave button works for joined games
  - Player count updates correctly
  - Host vs participant permissions

- [ ] **Game Details Page**
  - All game information displays
  - Host and player ratings consistent (both show 4.5)
  - Three-dot menu appears in foreground
  - Edit/Cancel options work for game creators
  - Weather information accurate

### **4. Social Features (10-15 minutes)**
- [ ] **User Profiles**
  - Profile stats show correct games played/hosted
  - Achievements system working
  - Profile editing functional
  - Other user profiles viewable

- [ ] **Online Presence**
  - OnlinePlayersWidget shows data (demo or real)
  - No infinite loading (3-second timeout)
  - Graceful fallback when WebSocket fails

---

## 📱 Device & Browser Testing

### **Desktop Testing**
- [ ] Chrome/Safari/Firefox compatibility
- [ ] Responsive design at different screen sizes
- [ ] Keyboard navigation working
- [ ] All buttons and forms functional

### **Mobile Testing**
- [ ] iOS Safari and Android Chrome
- [ ] Touch interactions smooth
- [ ] Mobile navigation working
- [ ] Forms usable on small screens
- [ ] Map interactions work on touch

---

## 🔍 Edge Cases & Error Handling

### **Network Issues**
- [ ] App works with slow internet
- [ ] Offline functionality (service worker)
- [ ] WebSocket failures handled gracefully
- [ ] API timeouts don't break UI

### **User Input Validation**
- [ ] Form validation working
- [ ] Error messages clear and helpful
- [ ] Required fields enforced
- [ ] Invalid data rejected gracefully

### **Authentication Edge Cases**
- [ ] Session expiration handled
- [ ] Logout functionality works
- [ ] Protected routes redirect properly
- [ ] OAuth callback handling

---

## 📊 User Feedback Collection

### **Usability Questions**
- [ ] "How intuitive was the game creation process?"
- [ ] "Did you understand how to join/leave games?"
- [ ] "Was the navigation clear and logical?"
- [ ] "Any confusing or broken features?"

### **Performance Questions**
- [ ] "Did pages load quickly enough?"
- [ ] "Any features that felt slow or unresponsive?"
- [ ] "Did you experience any crashes or errors?"

### **Feature Feedback**
- [ ] "What features did you find most useful?"
- [ ] "What's missing that you'd expect to see?"
- [ ] "Would you use this app to organize sports activities?"

---

## 🐛 Common Issues to Watch For

### **Known Potential Issues**
- [ ] **Google OAuth warning**: "This app hasn't been verified" - normal for development
- [ ] **WebSocket errors**: Console errors are expected, app handles with fallback
- [ ] **Presence system**: May show demo data instead of real users
- [ ] **Service worker**: May cache old versions, hard refresh if needed

### **Red Flags to Stop Testing**
- [ ] Infinite loading screens (should timeout in 3-10 seconds)
- [ ] Complete app crashes or white screens
- [ ] Unable to create or join games
- [ ] Authentication completely broken

---

## 📝 Testing Session Template

### **Session Info**
- **Date/Time**: ___________
- **User**: ___________
- **Device/Browser**: ___________
- **Duration**: ___________

### **Task Completion**
- [ ] Successfully signed up
- [ ] Created a game
- [ ] Joined someone else's game
- [ ] Navigated between screens
- [ ] Completed profile setup

### **Issues Found**
1. ___________
2. ___________
3. ___________

### **User Feedback**
- **Most liked**: ___________
- **Most confusing**: ___________
- **Suggestions**: ___________

---

## 🚀 Post-Testing Action Items

### **High Priority Fixes**
- [ ] Any blocking bugs that prevent core functionality
- [ ] Major usability issues affecting user flow
- [ ] Performance problems causing user frustration

### **Medium Priority Improvements**
- [ ] UI/UX enhancements based on feedback
- [ ] Missing features users expected
- [ ] Minor bugs that don't block usage

### **Future Enhancements**
- [ ] Feature requests for future versions
- [ ] Nice-to-have improvements
- [ ] Advanced functionality suggestions

---

## 📞 Support During Testing

**If users encounter issues:**
1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear browser cache**: DevTools → Application → Storage → Clear site data
3. **Check console**: F12 → Console tab for error messages
4. **Restart dev server**: `npm run dev` if needed

**Contact for technical issues**: [Your contact info]

## 📋 Survey Implementation Options

**Two survey options have been created:**

### **Option 1: Integrated Survey (Recommended)**
- **File**: `src/components/UserTestingSurvey.tsx`
- **Usage**: Triggered within the app after specific actions
- **Benefits**: Seamless UX, contextual feedback, higher completion rates

**How to use:**
```tsx
import { UserTestingSurvey } from './components/UserTestingSurvey';
import { useUserTestingSurvey } from './hooks/useUserTestingSurvey';

// In your component:
const { isSurveyOpen, triggerContext, openSurvey, closeSurvey } = useUserTestingSurvey();

// Trigger after game creation:
openSurvey('game_creation');

// Render the survey:
<UserTestingSurvey 
  isOpen={isSurveyOpen} 
  onClose={closeSurvey} 
  triggerContext={triggerContext} 
/>
```

### **Option 2: Standalone HTML Survey**
- **File**: `standalone-survey.html` (see below)
- **Usage**: Separate webpage for external testing
- **Benefits**: Works without app access, easy to share

**Database**: Both options store responses in `user_testing_feedback` table

---

**🎯 Success Criteria**: Users can successfully sign up, create/join games, and navigate the app without major frustration. Minor bugs are acceptable - focus on overall user experience and core functionality!

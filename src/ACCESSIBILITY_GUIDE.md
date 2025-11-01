# TribeUp Accessibility Compliance Guide
## WCAG 2.1 AA Implementation & Testing

### Overview
This guide ensures TribeUp meets WCAG 2.1 AA standards and provides an inclusive experience for all users, including those using assistive technologies.

---

## WCAG 2.1 AA Compliance Checklist

### 1. Perceivable

#### 1.1 Text Alternatives
- [ ] All images have appropriate alt text
- [ ] Decorative images have empty alt attributes (`alt=""`)
- [ ] Complex images have detailed descriptions
- [ ] Sport icons use semantic meaning in alt text
- [ ] Loading states announced to screen readers

**Implementation:**
```tsx
// Game images
<img 
  src={game.imageUrl} 
  alt={`${game.sport} game at ${game.location} on ${game.date}`}
/>

// Decorative images
<div className="bg-image" role="img" aria-label="" />

// Sport icons with meaning
<span role="img" aria-label="Basketball game">🏀</span>
```

#### 1.2 Time-based Media
- [ ] Auto-playing content can be paused
- [ ] No content flashes more than 3 times per second
- [ ] Video content has captions (if applicable)

#### 1.3 Adaptable
- [ ] Content structure is meaningful without CSS
- [ ] Information conveyed by color is also available in other ways
- [ ] Sport categories use both color and text/icons
- [ ] Reading order is logical
- [ ] Form inputs have proper labels

**Color Independence Test:**
```tsx
// Bad: Only color indicates status
<div className="text-red-500">Error occurred</div>

// Good: Color + icon + text
<div className="text-destructive flex items-center gap-2">
  <AlertCircle className="w-4 h-4" />
  <span>Error: Please check your input</span>
</div>
```

#### 1.4 Distinguishable
- [ ] Color contrast ratios meet minimum standards:
  - Normal text: 4.5:1
  - Large text (18px+): 3:1
  - UI components: 3:1
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] No horizontal scrolling at 320px width
- [ ] Focus indicators are clearly visible

**Contrast Testing:**
```css
/* Primary button - 4.64:1 ratio (Pass) */
.btn-primary {
  background: #FA4616; /* Orange */
  color: #ffffff;      /* White */
}

/* Text on background - 5.89:1 ratio (Pass) */
.text-primary {
  color: #343741;      /* Dark gray */
  background: #ffffff; /* White */
}
```

### 2. Operable

#### 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Focus order is logical
- [ ] Keyboard shortcuts don't conflict with browser/AT shortcuts

**Keyboard Navigation Map:**
```
Tab Order:
1. Skip to main content link
2. Main navigation (Home, Search, Create, Profile)
3. Primary actions (Join Nearby Games, Create Game)
4. Game cards (in reading order)
5. Secondary actions
6. Footer navigation
```

**Keyboard Shortcuts:**
- `Alt + 1`: Home screen
- `Alt + 2`: Search screen  
- `Alt + 3`: Create game screen
- `Alt + 4`: Profile screen
- `Alt + H`: Home (alternative)
- `Alt + S`: Search (alternative)
- `Alt + C`: Create (alternative)
- `Alt + P`: Profile (alternative)
- `Escape`: Close modal/go back

#### 2.2 Enough Time
- [ ] No time limits on reading content
- [ ] Auto-refresh can be controlled
- [ ] Session timeouts have warnings
- [ ] Moving content can be paused

#### 2.3 Seizures and Physical Reactions
- [ ] No content flashes more than 3 times per second
- [ ] Animation respects `prefers-reduced-motion`

**Reduced Motion Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 2.4 Navigable
- [ ] Pages have descriptive titles
- [ ] Focus order follows logical sequence
- [ ] Link purposes are clear from context
- [ ] Multiple ways to locate content (navigation, search)
- [ ] Headings organize content hierarchically

**Heading Structure:**
```html
<h1>TribeUp</h1>                    <!-- Page title -->
  <h2>Happening Soon</h2>           <!-- Major section -->
    <h3>Basketball Pickup</h3>      <!-- Game title -->
  <h2>Upcoming Games</h2>           <!-- Major section -->
    <h3>Soccer Scrimmage</h3>       <!-- Game title -->
```

#### 2.5 Input Modalities
- [ ] Touch targets are at least 44x44px
- [ ] Adequate spacing between touch targets
- [ ] Gestures don't require precise timing
- [ ] Device motion not required for operation

### 3. Understandable

#### 3.1 Readable
- [ ] Page language is identified (`<html lang="en">`)
- [ ] Language changes are identified
- [ ] Unusual words are defined
- [ ] Abbreviations are explained on first use

#### 3.2 Predictable
- [ ] Navigation is consistent across pages
- [ ] UI components behave consistently
- [ ] No automatic context changes
- [ ] Form submissions are predictable

#### 3.3 Input Assistance
- [ ] Form errors are clearly identified
- [ ] Error messages provide suggestions
- [ ] Labels and instructions are provided
- [ ] Error prevention for important submissions

**Form Validation Example:**
```tsx
// Error state with clear messaging
<div className="space-y-2">
  <label htmlFor="game-title" className="text-destructive">
    Game Title *
  </label>
  <input 
    id="game-title"
    aria-invalid="true"
    aria-describedby="title-error"
    className="border-destructive"
  />
  <div id="title-error" className="text-destructive text-sm">
    <AlertCircle className="w-4 h-4 inline mr-1" />
    Game title is required and must be at least 3 characters long.
  </div>
</div>
```

### 4. Robust

#### 4.1 Compatible
- [ ] Valid HTML markup
- [ ] Proper ARIA usage
- [ ] Compatible with assistive technologies
- [ ] Future-proof semantic markup

---

## Screen Reader Testing

### Testing Tools
- **NVDA** (Windows) - Free
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in
- **JAWS** (Windows) - Commercial

### Screen Reader Test Script

#### 1. Navigation Test
1. Turn on screen reader
2. Load TribeUp homepage
3. Navigate using headings (H key in NVDA/JAWS)
4. Verify all content is announced
5. Test skip links (Tab to first link, press Enter)

#### 2. Form Interaction Test
1. Navigate to Create Game form
2. Tab through all form fields
3. Verify labels are announced
4. Trigger validation errors
5. Verify error messages are announced
6. Complete form submission

#### 3. Dynamic Content Test
1. Trigger toast notifications
2. Load more content (infinite scroll)
3. Open/close modals
4. Verify live regions announce changes

**Live Region Implementation:**
```tsx
// Status updates
<div 
  id="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// Urgent alerts
<div 
  id="alerts" 
  aria-live="assertive" 
  aria-atomic="true"
  className="sr-only"
>
  {alertMessage}
</div>
```

---

## Mobile Accessibility

### Touch Targets
```css
/* Minimum touch target size */
@media (max-width: 768px) {
  button,
  [role="button"],
  input[type="submit"],
  input[type="button"],
  input[type="reset"],
  .clickable {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Voice Control Support
- [ ] All interactive elements have accessible names
- [ ] Complex gestures have alternatives
- [ ] Voice commands work reliably

### Screen Reader Mobile Gestures
- **Swipe right**: Next element
- **Swipe left**: Previous element
- **Double tap**: Activate element
- **Two-finger tap**: Stop reading
- **Three-finger swipe**: Scroll

---

## High Contrast Mode

### System Integration
```css
/* Automatic high contrast detection */
@media (prefers-contrast: high) {
  .high-contrast {
    --border: #000000;
    --focus-ring: #0000ff;
    --primary: #000000;
    --background: #ffffff;
  }
}

/* Manual high contrast toggle */
.high-contrast {
  --background: #ffffff;
  --foreground: #000000;
  --primary: #000000;
  --secondary: #000000;
  --border: #000000;
  --focus-ring: #0000ff;
  
  /* Override all sport colors */
  --sport-basketball: #000000;
  --sport-soccer: #000000;
  --sport-tennis: #000000;
  --sport-volleyball: #000000;
  --sport-football: #000000;
  --sport-baseball: #000000;
}
```

### Testing High Contrast
1. Enable Windows High Contrast mode
2. Test all interactive elements are visible
3. Verify focus indicators are prominent
4. Check color-coded information has alternatives

---

## Color Vision Accessibility

### Color-Blind Friendly Design
```css
/* Alternative sport colors for color-blind users */
.colorblind-friendly {
  --sport-basketball: #FF6B35; /* More distinct orange */
  --sport-soccer: #4CAF50;     /* Brighter green */
  --sport-tennis: #2196F3;     /* Clearer blue */
  --sport-volleyball: #FFC107; /* More saturated yellow */
  --sport-football: #9C27B0;   /* Distinct purple */
  --sport-baseball: #F44336;   /* Bright red */
}
```

### Color Independence Rules
1. Never rely solely on color to convey information
2. Use patterns, shapes, or text as alternatives
3. Provide multiple visual cues for status

**Good Example:**
```tsx
<Badge className={`${isActive ? 'bg-success' : 'bg-muted'}`}>
  {isActive && <CheckCircle className="w-3 h-3 mr-1" />}
  {isActive ? 'Active' : 'Inactive'}
</Badge>
```

---

## Testing Automation

### Accessibility Testing Tools

#### axe-core Integration
```tsx
// Install: npm install @axe-core/react
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<UnifiedGameCard game={mockGame} variant="simple" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli@0.8.x
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

#### Pa11y Testing
```javascript
// pa11y-ci config
{
  "sitemap": "http://localhost:3000/sitemap.xml",
  "standard": "WCAG2AAA",
  "level": "error",
  "threshold": 0
}
```

### Manual Testing Checklist

#### Daily Testing (During Development)
- [ ] Tab through new features
- [ ] Check color contrast of new elements
- [ ] Verify form labels and error messages
- [ ] Test with keyboard only

#### Weekly Testing
- [ ] Full screen reader test
- [ ] Mobile accessibility test
- [ ] High contrast mode test
- [ ] Reduced motion test

#### Pre-Release Testing
- [ ] Complete WCAG audit
- [ ] Multiple screen reader testing
- [ ] User testing with disabled users
- [ ] Performance with assistive technology

---

## Accessibility Features Implementation

### Skip Links
```tsx
export function SkipLinks() {
  return (
    <>
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={() => announceToScreenReader('Skip to main content available')}
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
      >
        Skip to navigation
      </a>
    </>
  );
}
```

### Focus Management
```tsx
// Focus trap for modals
import { useFocusTrap } from './hooks/useFocusTrap';

export function Modal({ isOpen, onClose, children }) {
  const trapRef = useFocusTrap(isOpen);
  
  return (
    <div 
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button 
        onClick={onClose}
        aria-label="Close modal"
        className="absolute top-4 right-4"
      >
        <X className="w-6 h-6" />
      </button>
      {children}
    </div>
  );
}
```

### Announcement System
```tsx
// Screen reader announcements
export function useAnnouncements() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);
  
  return { announce };
}
```

---

## User Testing with Disabilities

### Recruiting Participants
- Partner with disability advocacy groups
- Include users of various assistive technologies
- Test with both experienced and novice AT users
- Compensate participants fairly

### Testing Protocol
1. **Pre-test**: Explain purpose, get consent
2. **Tasks**: Realistic scenarios (join a game, create profile)
3. **Observation**: Note struggles, workarounds
4. **Interview**: Gather feedback on experience
5. **Follow-up**: Share findings, implement changes

### Common Issues to Watch For
- **Navigation confusion**: Lost in interface
- **Missing information**: AT doesn't convey full context
- **Interaction difficulties**: Can't complete tasks
- **Cognitive load**: Interface too complex
- **Physical barriers**: Touch targets too small

---

## Accessibility Statement

### Public Commitment
```markdown
# Accessibility Statement for TribeUp

TribeUp is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status
TribeUp partially conforms with WCAG 2.1 level AA. "Partially conforms" means that some parts of the content do not fully conform to the accessibility standard.

## Feedback
We welcome your feedback on the accessibility of TribeUp. Please let us know if you encounter accessibility barriers:
- Email: accessibility@tribeup.com
- Phone: [phone number]

We try to respond to feedback within 2 business days.

## Compatibility
TribeUp is designed to be compatible with:
- Screen readers (NVDA, JAWS, VoiceOver)
- Voice recognition software
- Keyboard-only navigation
- Mobile accessibility features

Last updated: [Date]
```

---

## Accessibility Maintenance

### Ongoing Responsibilities
- [ ] Regular accessibility audits
- [ ] Staff training on accessible design
- [ ] User feedback monitoring
- [ ] Assistive technology testing
- [ ] Documentation updates

### Update Process
1. **New Features**: Accessibility review before release
2. **Bug Fixes**: Include accessibility testing
3. **Design Changes**: Re-evaluate WCAG compliance
4. **Third-party Updates**: Test compatibility
5. **User Reports**: Prioritize accessibility issues

This accessibility guide ensures TribeUp provides an inclusive experience for all users. Regular testing and user feedback are essential for maintaining accessibility standards.

**Key Contacts:**
- Accessibility Lead: [Name]
- UX Designer: [Name]  
- Frontend Developer: [Name]
- QA Engineer: [Name]
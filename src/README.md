# TribeUp - Social Sports App

TribeUp is a modern, mobile-first social sports application that helps people find and join pickup games in their area. Built with React, TypeScript, and Tailwind CSS, it features comprehensive accessibility support, real-time chat, and a responsive design that works seamlessly across all devices.

## 🏆 Features

### Core Functionality
- **Game Discovery**: Find nearby pickup games with advanced filtering
- **Game Creation**: Create and host your own games with a simple 3-step process
- **Real-time Chat**: WebSocket-powered messaging for game coordination
- **User Profiles**: Personal stats, achievements, and game history
- **Location Services**: GPS-based game discovery and directions

### Advanced Features
- **Push Notifications**: Stay updated on game changes and messages
- **Offline Support**: PWA with service worker for offline functionality
- **Deep Linking**: Direct links to specific games and conversations
- **Keyboard Shortcuts**: Power user features for desktop
- **Dark Mode**: System-aware theme switching

### Accessibility (WCAG 2.1 AA Compliant)
- **Screen Reader Support**: Full compatibility with NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Complete keyboard-only operation
- **High Contrast Mode**: System-level high contrast integration
- **Reduced Motion**: Respects user motion preferences
- **Color Independence**: Information conveyed through multiple channels

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/tribeup.git
cd tribeup

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm run test         # Run tests
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **State Management**: Zustand with persistence
- **Routing**: React Router v6 with lazy loading
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (45+ components)

### Project Structure
```
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── figma/          # Protected Figma components
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── styles/             # Global CSS and design tokens
├── public/             # Static assets and service worker
└── docs/               # Documentation
```

## 🎨 Design System

TribeUp uses a comprehensive design system based on University of Florida brand colors:

### Color Palette
- **Primary**: UF Orange (#FA4616)
- **Secondary**: UF Blue (#0021A5)
- **Sports Colors**: Basketball, Soccer, Tennis, Volleyball, Football, Baseball
- **System Colors**: Success, Warning, Destructive, Muted

### Typography
- **Base Size**: 14px (mobile), 16px (desktop)
- **Scale**: Harmonious typographic scale
- **Fonts**: System fonts with fallbacks

### Spacing & Layout
- **Grid System**: Responsive CSS Grid
- **Breakpoints**: Mobile-first (320px, 768px, 1024px, 1440px)
- **Containers**: Fluid with max-widths

## ♿ Accessibility

TribeUp is fully compliant with WCAG 2.1 AA standards:

### Features
- **Skip Links**: Navigate directly to main content
- **Focus Management**: Logical tab order and focus indicators
- **Screen Reader Support**: Comprehensive ARIA labels and live regions
- **Keyboard Shortcuts**: Alt+1-4 for navigation, Ctrl+K for search
- **High Contrast**: System integration and manual toggle
- **Color Blind Friendly**: Alternative color schemes available

### Testing
- Automated testing with axe-core
- Manual testing with screen readers
- Keyboard-only navigation verification
- Color contrast validation

## 📱 Mobile & PWA

### Mobile Features
- **Touch Targets**: Minimum 44x44px touch areas
- **Gestures**: Pull-to-refresh, swipe navigation
- **Viewport**: Optimized for all screen sizes
- **Performance**: Lazy loading and code splitting

### PWA Features
- **Service Worker**: Offline support and caching
- **Push Notifications**: Real-time updates
- **Install Prompt**: Add to home screen
- **Background Sync**: Offline message sending

## 🧪 Testing

### Test Strategy
```bash
# Unit Tests
npm run test

# Accessibility Tests
npm run test:a11y

# Coverage Report
npm run test:coverage
```

### Testing Tools
- **Unit**: Vitest + React Testing Library
- **Accessibility**: axe-core + jest-axe
- **E2E**: Recommended Playwright or Cypress

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create `.env.production` with:
```env
VITE_API_URL=your_api_url
VITE_WS_URL=your_websocket_url
VITE_MAPS_API_KEY=your_maps_key
```

### Deployment Targets
- **Vercel**: Zero-config deployment
- **AWS S3/CloudFront**: Enterprise hosting
- **Docker**: Containerized deployment

## 📚 Documentation

- **[Developer Guide](./DEVELOPER_GUIDE.md)**: Technical implementation details
- **[Accessibility Guide](./ACCESSIBILITY_GUIDE.md)**: WCAG compliance documentation
- **[Design System](./DESIGN_SYSTEM.md)**: Design tokens and components
- **[API Documentation](./API.md)**: Backend integration guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure accessibility compliance
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Maintain WCAG 2.1 AA compliance
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui**: Component library foundation
- **Unsplash**: Stock photography for examples
- **University of Florida**: Brand colors and inspiration
- **Lucide**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

## 📞 Support

For support, email support@tribeup.com or join our Discord community.

---

**Built with ❤️ by the TribeUp Team**
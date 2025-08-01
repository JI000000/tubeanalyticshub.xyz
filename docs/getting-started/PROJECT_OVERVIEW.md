# YouTube Analytics Platform

## 🎯 Project Overview

A comprehensive AI-powered YouTube Analytics Platform built with Next.js 15, providing professional content analysis, insights, and team collaboration features.

## ✨ Key Features

### 📊 Analytics & Insights
- Real-time YouTube channel analytics
- AI-powered content recommendations
- Performance tracking and reporting
- Competitor analysis tools

### 🌐 Multi-language Support
- English, Chinese, Japanese, Korean
- AI-powered translation system
- Localized user interface

### 👥 Team Collaboration
- Team management and invitations
- Role-based access control
- Collaborative reporting

### 🚀 Performance & Monitoring
- Real-time performance monitoring
- Health check endpoints
- Optimized for production deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **APIs**: YouTube Data API v3
- **Deployment**: Vercel
- **Internationalization**: next-intl

## 📁 Project Structure

```
youtube-scraper/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── i18n/               # Internationalization
│   ├── lib/                # Utilities and APIs
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── scripts/                # Development scripts
├── supabase/              # Database schema
└── public/                # Static assets
```

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd youtube-scraper
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Database Setup**
   ```bash
   node scripts/database/init-database.js
   ```

4. **Development**
   ```bash
   npm run dev
   ```

5. **Build & Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

## 📚 Documentation

- [Setup Guide](./docs/setup-guide.md)
- [Development Guidelines](./docs/04-development/)
- [Internationalization](./docs/06-i18n/)
- [API Documentation](./docs/api/)

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run health` - Check project health
- `npm run deploy:prep` - Prepare for deployment

## 📈 Current Status

✅ **Production Ready**
- Successfully built and tested
- Multi-language support implemented
- Team collaboration features complete
- Performance monitoring active
- Deployed and accessible

## 🤝 Contributing

1. Follow the development guidelines in `/docs/04-development/`
2. Use the provided scripts for testing and validation
3. Ensure all translations are properly validated
4. Run health checks before submitting changes

## 📄 License

This project is proprietary software. All rights reserved.
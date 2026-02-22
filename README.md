# Giaom Marketplace - React Frontend

React frontend application for Giaom Marketplace built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```
Then edit `.env` with your configuration.

### 3. Run Development Server
```bash
npm run dev
```

App will run on `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client

## 📁 Project Structure

```
src/
├── components/      # React components
│   ├── ui/         # shadcn/ui components
│   ├── Header.tsx
│   └── Footer.tsx
├── pages/          # Page components
├── context/        # React contexts
├── services/       # API service layer
├── utils/          # Utility functions
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## 🔗 API Connection

The app connects to the backend API at `http://localhost:5000/api` (configured in `.env`).

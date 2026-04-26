# SafeStay AI

**Detect faster. Respond smarter. Save lives.**

SafeStay AI is an AI-powered real-time emergency coordination platform that allows guests or staff to report emergencies instantly, captures context, uses Gemini AI to classify severity and summarize the incident, and synchronizes alerts across responders in real time.

Built for the Solution Challenge 2026 India.

## Tech Stack
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui (customized)
- Backend: Next.js API Routes, Firebase Firestore, Firebase Authentication
- AI: Google Gemini API (gemini-1.5-flash)
- Deployment: Vercel / Firebase Hosting

## Features
- **Instant Reporting:** Guests and staff can quickly report fires, medical emergencies, or security issues.
- **AI-Powered Triage:** Gemini AI automatically classifies incident severity, summarizes the situation, and generates recommended action playbooks.
- **Role-Based Access:** Dedicated real-time dashboards for Guests, Staff, Responders, and Admins.
- **Real-Time Sync:** Firestore listeners ensure all responders get live updates, status tracking, and coordinated assignments instantly.

## Setup Instructions

### 1. Clone & Install
\`\`\`bash
git clone <your-repo-url>
cd website
npm install
\`\`\`

### 2. Environment Variables
Create a \`.env.local\` file in the root directory (use \`.env.example\` as a guide):

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
\`\`\`

### 3. Firebase Setup
1. Go to Firebase Console and create a new project.
2. Enable Authentication (Email/Password).
3. Enable Firestore Database.
4. Add a Web App to the project and copy the configuration keys to your \`.env.local\`.
5. Set up basic Firestore security rules (or allow read/write for testing).

### 4. Running the Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seed Data for Demo
To easily demo the app, you can create these accounts via the signup page:
- \`guest@safestay.com\` (Role: Guest)
- \`staff@safestay.com\` (Role: Staff)
- \`responder@safestay.com\` (Role: First Responder)
- \`admin@safestay.com\` (Role: Administrator)

*Note: In the demo build, there is a "Use Demo Admin Account" shortcut on the login screen which auto-fills the admin login details.*

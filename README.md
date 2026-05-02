# SafeStay AI

**Detect faster. Respond smarter. Save lives.**

SafeStay AI is an AI-powered real-time emergency coordination platform designed for hospitality environments such as hotels, hostels, and managed living spaces. It enables guests or staff to instantly report emergencies, leverages Google Gemini AI for intelligent triage, and synchronizes alerts across all stakeholders in real time.

---

## 🚀 Live Demo
👉 https://safestayai.vercel.app/

---

## 🧠 Problem Statement

In hospitality environments, emergencies often lead to fragmented communication between guests, staff, responders, and administrators. This causes delays, confusion, and inefficient coordination during critical moments where response time is crucial.

---

## 💡 Our Solution

SafeStay AI provides a centralized AI-powered crisis coordination system that:

- Enables instant emergency reporting
- Uses AI to classify severity and generate summaries
- Provides real-time safety guidance
- Synchronizes incident updates across all roles
- Ensures structured, role-based coordination

---

## ⚡ Key Features

### 🔹 Instant Emergency Reporting
Guests and staff can report incidents such as fire, medical emergencies, or suspicious activity with location and details.

### 🔹 AI-Powered Triage (Google Gemini)
- Classifies incident type
- Assesses severity
- Generates concise summaries
- Provides recommended actions

### 🔹 Real-Time Safety Guidance
Users receive immediate AI-generated instructions based on the emergency.

### 🔹 Role-Based Dashboards
- **Guest** – Report incidents & track status
- **Staff** – Monitor and acknowledge incidents
- **First Responder** – Handle assigned missions
- **Admin** – Full command center with control

### 🔹 Live Synchronization
Firebase Firestore ensures real-time updates across all users.

### 🔹 Secure Access Control
- Public users → Guest / Staff only  
- Admin → Google Sign-In + allowlist  
- First Responders → Assigned by Admin  

---

## 🔄 How It Works

1. Guest/Staff reports an incident  
2. Google Gemini analyzes the report  
3. AI generates severity + summary + guidance  
4. Firestore syncs data in real time  
5. Staff & Admin receive alerts  
6. Admin assigns a responder  
7. Responder executes and updates status  
8. Incident is resolved and logged  

---

## 🤖 AI Features

Powered by Google Gemini:

- Incident classification  
- Severity assessment  
- AI summaries  
- Real-time safety guidance  
- Response playbooks  
- Escalation support  
- Post-incident insights  

---

## 🛠 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Next.js API Routes
- Firebase Authentication
- Firebase Cloud Firestore

### AI
- Google Gemini API (gemini-1.5-flash)

### Deployment
- Vercel

---

## 🔐 Access Model

- Public signup → Guest / Staff only  
- Admin → Google Sign-In with allowlisted emails  
- First Responder → Assigned internally by Admin  

---

## ⚙️ Setup Instructions

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/outlandish-dude/SafeStay-AI.git
cd website
npm install
\`\`\`

### 2. Environment Variables
Create a \`.env.local\` file:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST=your_email@example.com
\`\`\`

### 3. Firebase Setup
- Enable Authentication (Email + Google)
- Enable Firestore
- Add authorized domains (localhost + production URL)

### 4. Run Locally
\`\`\`bash
npm run dev
\`\`\`

---

## 🔮 Future Scope

- Voice-based emergency reporting  
- AI risk prediction & hotspot detection  
- IoT & CCTV integration  
- Mass emergency broadcast system  
- Multi-property support  
- Advanced analytics dashboard  

---

## 🏆 Why SafeStay AI?

SafeStay AI is not just an emergency reporting tool.  
It is a **complete AI-powered crisis coordination platform** designed for real-world deployment.

---

## 👥 Team

**Code Red Collective**

---

## 🎯 Built For

**Solution Challenge 2026 – Build with AI (India)**

---

## 📄 License

This project is a hackathon prototype built for demonstration purposes.


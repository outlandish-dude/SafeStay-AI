````md
# SafeStay AI

**Detect faster. Respond smarter. Save lives.**

SafeStay AI is an AI-powered real-time emergency coordination platform built for hospitality environments. It enables guests or staff to instantly report emergencies, uses Google Gemini to classify severity and generate operational summaries, and synchronizes alerts across staff, responders, and administrators in real time.

Built for **Solution Challenge 2026 India**.

## Live Demo
- **Production:** https://safestayai.vercel.app/

## Problem Statement
Hospitality venues often face high-stakes emergencies where critical information is fragmented between guests, staff, responders, and decision-makers. This leads to delayed detection, poor coordination, and slower response times when every second matters. SafeStay AI addresses this by providing a unified, AI-powered emergency coordination system designed specifically for hospitality operations.

## Key Features
- **Instant Emergency Reporting**  
  Guests and staff can quickly report fires, medical emergencies, or security incidents with context such as location and description.

- **AI-Powered Incident Triage**  
  Google Gemini automatically classifies incident type, assesses severity, generates concise operational summaries, and provides recommended response guidance.

- **Role-Based Access Control**  
  Dedicated real-time dashboards for Guests, Staff, First Responders, and Admins with secure, role-specific functionality.

- **Real-Time Incident Synchronization**  
  Firebase Cloud Firestore listeners ensure live updates across all stakeholders, enabling faster coordination and response.

- **Secure Privileged Access Model**  
  Public users can only sign up as Guest or Staff. Admin access is restricted via Google Sign-In with an allowlisted authentication flow, and First Responder access is assigned internally by Admins.

## How It Works
1. A **Guest or Staff** user reports an emergency.
2. The incident is sent to the backend and analyzed by **Google Gemini**.
3. Gemini generates:
   - incident classification
   - severity level
   - summary
   - response guidance
4. The incident is stored in **Cloud Firestore**.
5. **Staff and Admin** dashboards receive live updates in real time.
6. An **Admin** can monitor, prioritize, and assign a **First Responder**.
7. The **First Responder** updates mission status (En Route / In Progress / Resolved).
8. The incident is tracked through completion and retained for operational visibility.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui (customized)
- **Backend:** Next.js API Routes, Firebase Authentication, Cloud Firestore
- **AI:** Google Gemini API (`gemini-1.5-flash`)
- **Deployment:** Vercel

## Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/outlandish-dude/SafeStay-AI.git
cd website
npm install
````

### 2. Environment Variables

Create a `.env.local` file in the root directory (use `.env.example` as a guide):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Admin allowlist (comma-separated)
NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST=your_admin_email_1,your_admin_email_2,your_admin_email_3
```

### 3. Firebase Setup

1. Go to the **Firebase Console** and create a new project.
2. Enable **Authentication**:

   * Email/Password (for Guest/Staff)
   * Google Sign-In (for Admin allowlisted accounts)
3. Enable **Cloud Firestore**.
4. Add a **Web App** and copy the Firebase config values into `.env.local`.
5. In **Authentication → Settings → Authorized domains**, add:

   * `localhost`
   * your deployed Vercel domain (for example: `safestayai.vercel.app`)
6. Configure Firestore rules appropriately for development/testing.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Access Model

* **Public signup:** Guest and Staff only
* **Admin access:** Restricted to Google Sign-In using the allowlisted team emails configured in `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST`
* **First Responder access:** Assigned internally by an Admin through the User Management / access control flow

## Suggested Demo Accounts

For local testing, you can create:

* `guest@safestay.com` → Guest
* `staff@safestay.com` → Staff

> Admin access is intentionally restricted and should not be publicly self-assigned.

## Future Scope

* Multilingual voice-based emergency reporting
* AI-powered hotspot and risk prediction
* Indoor navigation assistance for responders
* Mass-alert broadcasting to all guests during critical incidents
* CCTV / IoT integration for automated incident detection
* Multi-property support for hotel chains and hospitality groups
* Advanced analytics and compliance reporting

## Team

**Code Red Collective**

Built for **Solution Challenge 2026 India** using Google technologies to improve emergency response coordination in hospitality environments.



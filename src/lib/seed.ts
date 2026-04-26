// This is a utility file to provide a snippet the user can use to seed data
export const generateSeedDataInstructions = () => `
To seed the database with initial users and a test incident, you can create a temporary file or run this in a node script with firebase-admin setup:

\`\`\`javascript
const users = [
  { uid: "user_guest", email: "guest@safestay.com", name: "John Doe", role: "guest" },
  { uid: "user_staff", email: "staff@safestay.com", name: "Jane Staff", role: "staff" },
  { uid: "user_responder", email: "responder@safestay.com", name: "Mike Responder", role: "responder" },
  { uid: "user_admin", email: "admin@safestay.com", name: "Alice Admin", role: "admin" }
];

// Add these to 'users' collection in Firestore manually or via Admin SDK
\`\`\`
`;

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Triggered instantly anytime a user signs up via Firebase Auth
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const batch = db.batch();

  // 1. Create a core business tenant definition
  const businessRef = db.collection("businesses").doc();
  const businessData = {
    id: businessRef.id,
    name: user.displayName || "My Business", // Will be editable in settings
    slug: businessRef.id, // Initial public URL slug identifier
    ownerId: user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: "free",
  };
  batch.set(businessRef, businessData);

  // 2. Map the Auth User tightly to their new Business Tenant
  // This is CRITICAL for firestore.rules (isBusinessStaff function)
  const userRef = db.collection("users").doc(user.uid);
  const userData = {
    id: user.uid,
    email: user.email || "",
    businessId: businessRef.id,
    role: "owner",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  batch.set(userRef, userData);

  try {
    await batch.commit();
    console.log(`Successfully provisioned tenant (${businessRef.id}) for user ${user.uid}`);
  } catch (error) {
    console.error("Error provisioning tenant:", error);
  }
});

import { describe, expect, it } from "vitest";

describe("Firebase environment variables", () => {
  it("should have all required Firebase env vars set", () => {
    const requiredVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
    ];

    for (const varName of requiredVars) {
      expect(process.env[varName], `${varName} should be set`).toBeTruthy();
      expect(process.env[varName], `${varName} should not be a placeholder`).not.toContain("YOUR_");
    }
  });

  it("should have valid Firebase project ID format", () => {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    expect(projectId).toBeTruthy();
    expect(projectId).toBe("ordertakerios");
  });

  it("should have valid auth domain format", () => {
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toBeTruthy();
    expect(authDomain).toContain(".firebaseapp.com");
  });
});

import { getFirebaseAuth } from "@/shared/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

export async function getFirebaseIdToken(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  const auth = getFirebaseAuth();
  let user = auth.currentUser;
  if (!user) {
    user = await new Promise<typeof auth.currentUser>((resolve) => {
      const timeout = window.setTimeout(() => resolve(auth.currentUser), 1500);
      const unsub = onAuthStateChanged(auth, (nextUser) => {
        window.clearTimeout(timeout);
        unsub();
        resolve(nextUser);
      });
    });
  }
  if (!user) {
    return "";
  }

  return user.getIdToken();
}

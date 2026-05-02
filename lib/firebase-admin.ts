import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    _app = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
  } else {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project";
    _app = initializeApp({ projectId });
  }

  return _app;
}

export const adminAuth = {
  verifySessionCookie: (cookie: string, checkRevoked?: boolean) =>
    getAuth(getAdminApp()).verifySessionCookie(cookie, checkRevoked),
  createSessionCookie: (idToken: string, opts: { expiresIn: number }) =>
    getAuth(getAdminApp()).createSessionCookie(idToken, opts),
  verifyIdToken: (idToken: string) =>
    getAuth(getAdminApp()).verifyIdToken(idToken),
};

export const adminDb = {
  collection: (path: string) => getFirestore(getAdminApp()).collection(path),
};

export const adminStorage = {
  bucket: (name?: string) => getStorage(getAdminApp()).bucket(name),
};

export async function verifySessionCookie(session: string) {
  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export async function getSessionUid(session: string | undefined): Promise<string | null> {
  if (!session) return null;
  const decoded = await verifySessionCookie(session);
  return decoded?.uid ?? null;
}

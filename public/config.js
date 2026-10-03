// ─────────────────────────────────────────────────────────────
//  এই ফাইলটিই শুধু আপনাকে পূরণ করতে হবে।
//  Firebase Console → Project settings → Your apps → Web app → "SDK setup and configuration"
//  থেকে firebaseConfig-এর মানগুলো নিচে বসান।
//  firebase অংশ খালি থাকলে টুলটি "ডেমো মোডে" চলবে (কিছু সংরক্ষিত হবে না)।
//  (এই মানগুলো গোপন নয় — Firebase-এর নিয়মেই এগুলো পাবলিক থাকে; নিরাপত্তা firestore.rules-এ।)
// ─────────────────────────────────────────────────────────────
window.APP_CONFIG = {
  orgName: "বলোড়া হিলফুল ফুজুল",
  orgNameEn: "Bolora Hilf Al-Fudul",

  // মূল অ্যাডমিন। firestore.rules ফাইলের OWNER_EMAIL-এর সাথে হুবহু মিল থাকতে হবে।
  ownerEmail: "strockise.official@gmail.com",

  // সবাইকে যে ঠিকানা দেওয়া হবে (নির্বাচনের লিংকও এই ঠিকানায় তৈরি হয়)
  siteUrl: "https://bolora-hilf-al-fudul.web.app/",

  firebase: {
    apiKey: "AIzaSyCjyQ_Xr-fkfWvcZVBJNFn2A7gqzcqpKtY",
    authDomain: "bolora-election.firebaseapp.com",
    projectId: "bolora-election",
    appId: "1:1010091225225:web:f605ebb431f37c05421658"
  }
};

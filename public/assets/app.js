/* বলোড়া হিলফুল ফুজুল — নির্বাচন অ্যাপ
   ভোটার পাতা:  /          অ্যাডমিন প্যানেল: /admin  (অথবা #admin) */

const C = window.APP_CONFIG || {};
const ORG = C.orgName || "বলোড়া হিলফুল ফুজুল";
const ORG_EN = C.orgNameEn || "Bolora Hilf Al-Fudul";
const OWNER = (C.ownerEmail || "").trim().toLowerCase();
const FB = C.firebase || {};
const DEMO = !!C.forceDemo || !FB.apiKey || !FB.projectId;
const LOGO = C.logoSrc || "assets/logo.png";
const FB_VERSION = "10.12.2";

/* ── helpers ─────────────────────────────────────── */
const BN = "০১২৩৪৫৬৭৮৯";
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rid = (n = 8) => { const a = "abcdefghijklmnopqrstuvwxyz0123456789"; let s = ""; const r = crypto.getRandomValues(new Uint8Array(n)); r.forEach((x) => (s += a[x % a.length])); return s; };
const $ = (sel, el = document) => el.querySelector(sel);
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const collator = new Intl.Collator("bn");

const ICON = {
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4.2M8 4.6v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" stroke="currentColor" stroke-width="1.4"/></svg>',
  lockBig: '<svg width="28" height="28" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" stroke-width="1.1"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" stroke="currentColor" stroke-width="1.1"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/><path d="m10.5 10.5 3.3 3.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  google: '<svg class="g-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
};

const STATUS = {
  draft: { cls: "", label: "খসড়া" },
  open: { cls: "open", label: "ভোটগ্রহণ চলছে" },
  closed: { cls: "closed", label: "ভোটগ্রহণ শেষ" },
};
const statusPill = (st) => `<span class="status ${STATUS[st]?.cls || ""}"><i></i>${STATUS[st]?.label || ""}</span>`;

function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("লিংক কপি হয়েছে"); }
  catch { const r = document.createRange(); const c = $(".share code"); if (c) { r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast("লিংকটি সিলেক্ট করা হয়েছে, কপি করে নিন"); }
}
function errText(e) {
  const code = e?.code || "";
  if (code.includes("permission-denied")) return "এই কাজের অনুমতি নেই।";
  if (code.includes("unavailable") || code.includes("network")) return "ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।";
  if (code.includes("unauthorized-domain")) return "এই ঠিকানাটি Firebase-এ অনুমোদিত নয় (Authorized domains-এ যোগ করুন)।";
  if (code.includes("popup")) return "লগইন উইন্ডো খোলা যায়নি। আবার চেষ্টা করুন।";
  return "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
}
const inAppBrowser = () => /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|MicroMessenger|imo|; wv\)/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);
function voterLink() {
  if (DEMO) return "https://আপনার-প্রজেক্ট.web.app";
  return location.origin + location.pathname.replace(/\/admin\/?$/, "/").replace(/index\.html$/, "");
}

/* ── Firebase backend ────────────────────────────── */
async function firebaseBackend() {
  const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);
  const app = initializeApp(FB);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  A.getRedirectResult(auth).catch((e) => toast(errText(e)));

  const d = (...p) => F.doc(db, ...p);
  const col = (...p) => F.collection(db, ...p);
  const toUser = (u) => u && { uid: u.uid, email: (u.email || "").toLowerCase(), name: u.displayName || "", photo: u.photoURL || "" };

  return {
    onAuth: (cb) => A.onAuthStateChanged(auth, (u) => cb(toUser(u))),
    async signIn() {
      try { await A.signInWithPopup(auth, provider); }
      catch (e) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) return A.signInWithRedirect(auth, provider);
        if (["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(e.code)) return;
        throw e;
      }
    },
    signOut: () => A.signOut(auth),
    watchSettings: (cb, err) => F.onSnapshot(d("settings", "app"), (s) => cb(s.exists() ? s.data() : {}), err),
    watchElection: (eid, cb, err) => F.onSnapshot(d("elections", eid), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), err),
    watchElections: (cb, err) => F.onSnapshot(F.query(col("elections"), F.orderBy("createdAt", "desc")), (q) => cb(q.docs.map((x) => ({ id: x.id, ...x.data() }))), err),
    hasVoted: async (eid, uid) => (await F.getDoc(d("elections", eid, "voters", uid))).exists(),
    isMember: async (email) => (await F.getDoc(d("members", email))).exists(),
    async isAdmin(user) {
      if (user.email === OWNER) return true;
      try { return (await F.getDoc(d("admins", user.email))).exists(); } catch { return false; }
    },
    async castVote(eid, cid, user) {
      // কাকে ভোট দেওয়া হলো তা কোথাও ভোটারের নামে সংরক্ষিত হয় না:
      // শুধু প্রার্থীর মোট সংখ্যা ১ বাড়ে, আর আলাদাভাবে "এই ব্যক্তি ভোট দিয়েছেন" রসিদ তৈরি হয়।
      const b = F.writeBatch(db);
      b.update(d("elections", eid, "meta", "box"), { pick: cid, n: rid(20) });
      b.update(d("elections", eid, "tally", cid), { count: F.increment(1) });
      b.set(d("elections", eid, "voters", user.uid), { email: user.email, name: (user.name || "").slice(0, 100) });
      await b.commit();
    },
    watchTally: (eid, cb, err) => F.onSnapshot(col("elections", eid, "tally"), (q) => { const o = {}; q.docs.forEach((x) => (o[x.id] = x.data().count || 0)); cb(o); }, err),
    watchVoters: (eid, cb, err) => F.onSnapshot(col("elections", eid, "voters"), (q) => cb(q.docs.map((x) => x.data())), err),
    watchMembers: (cb, err) => F.onSnapshot(col("members"), (q) => cb(q.docs.map((x) => ({ email: x.id, ...x.data() }))), err),
    watchAdmins: (cb, err) => F.onSnapshot(col("admins"), (q) => cb(q.docs.map((x) => ({ email: x.id, ...x.data() }))), err),
    async ensureSettings() {
      const r = d("settings", "app");
      const s = await F.getDoc(r);
      if (!s.exists()) await F.setDoc(r, { activeElection: null, restrict: false, liveResults: false });
    },
    updateSettings: (p) => F.setDoc(d("settings", "app"), p, { merge: true }),
    async createElection(title, candidates) {
      const r = F.doc(col("elections"));
      await F.setDoc(r, { title, status: "draft", candidates, candidateIds: candidates.map((c) => c.id), resultsPublic: false, createdAt: F.serverTimestamp() });
      return r.id;
    },
    updateElection: (eid, p) => F.updateDoc(d("elections", eid), p),
    async openElection(e) {
      const b = F.writeBatch(db);
      if (e.status === "draft") {
        e.candidates.forEach((c) => b.set(d("elections", e.id, "tally", c.id), { count: 0 }));
        b.set(d("elections", e.id, "meta", "box"), { pick: "", n: rid(20) });
      }
      b.update(d("elections", e.id), { status: "open", openedAt: F.serverTimestamp() });
      b.set(d("settings", "app"), { activeElection: e.id }, { merge: true });
      await b.commit();
    },
    async closeElection(e) {
      const b = F.writeBatch(db);
      b.update(d("elections", e.id), { status: "closed", closedAt: F.serverTimestamp() });
      b.set(d("elections", e.id, "meta", "box"), { pick: "", n: rid(20) });
      await b.commit();
    },
    deleteElection: (eid) => F.deleteDoc(d("elections", eid)),
    async addMembers(list) {
      for (let i = 0; i < list.length; i += 400) {
        const b = F.writeBatch(db);
        list.slice(i, i + 400).forEach((m) => b.set(d("members", m.email), { name: m.name || "" }));
        await b.commit();
      }
    },
    removeMember: (email) => F.deleteDoc(d("members", email)),
    addAdmin: (email) => F.setDoc(d("admins", email), { addedAt: F.serverTimestamp() }),
    removeAdmin: (email) => F.deleteDoc(d("admins", email)),
  };
}

/* ── Demo backend (কিছুই সংরক্ষিত হয় না) ───────────── */
function demoBackend() {
  const names = ["মোঃ আব্দুল করিম", "রফিকুল ইসলাম", "শাহানা পারভীন", "মোঃ জাহাঙ্গীর আলম", "নাসরিন আক্তার", "আবু সাঈদ", "কামরুল হাসান", "মোঃ সোহেল রানা", "তানজিলা খাতুন", "মিজানুর রহমান", "হাবিবুল্লাহ", "ফারুক আহমেদ"];
  const cands = names.map((name, i) => ({ id: "c" + (i + 1), name }));
  const seedVoters = ["আলমগীর হোসেন", "রুবিনা ইয়াসমিন", "মোঃ ইউনুস", "সেলিনা বেগম", "জসিম উদ্দিন", "মাসুদ রানা", "শফিকুল ইসলাম", "পারভেজ মোশাররফ", "আয়েশা সিদ্দিকা", "নুরুল আমিন", "ইমরান হোসেন", "সাবিনা ইয়াসমিন", "হাসান মাহমুদ", "রাশেদুল করিম", "ফাতেমা তুজ জোহরা", "আরিফুল হক", "মোস্তফা কামাল", "শামীম আহমেদ", "লিপি আক্তার", "জাকির হোসেন", "রবিউল ইসলাম", "তাসলিমা নাসরিন", "মাহফুজুর রহমান"];
  const st = {
    user: null,
    settings: { activeElection: "e1", restrict: false, liveResults: false },
    elections: {
      e1: { id: "e1", title: "সভাপতি নির্বাচন", status: "open", candidates: cands, candidateIds: cands.map((c) => c.id), resultsPublic: false, createdAt: 2 },
      e0: { id: "e0", title: "সাধারণ সম্পাদক নির্বাচন", status: "draft", candidates: cands.slice(0, 6), candidateIds: cands.slice(0, 6).map((c) => c.id), resultsPublic: false, createdAt: 1 },
    },
    tally: { e1: { c1: 4, c2: 6, c3: 2, c4: 1, c5: 3, c6: 0, c7: 2, c8: 1, c9: 0, c10: 3, c11: 1, c12: 0 } },
    voters: { e1: seedVoters.map((n, i) => ({ uid: "v" + i, email: `member${i + 1}@gmail.com`, name: n })) },
    members: [],
    admins: [{ email: "secretary.bhf@gmail.com" }],
  };
  const subs = new Set();
  const sub = (fn) => { subs.add(fn); queueMicrotask(fn); return () => subs.delete(fn); };
  const emit = () => subs.forEach((fn) => fn());
  const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
  let authCb = null;

  return {
    demo: true,
    demoAs: "member",
    onAuth(cb) { authCb = cb; queueMicrotask(() => cb(st.user)); return () => {}; },
    async signIn() {
      await wait(400);
      st.user = this.demoAs === "owner"
        ? { uid: "owner", email: OWNER || "admin@gmail.com", name: "অ্যাডমিন" }
        : { uid: "me", email: "member.demo@gmail.com", name: "ডেমো সদস্য" };
      authCb?.(st.user);
    },
    async signOut() { st.user = null; authCb?.(null); },
    watchSettings: (cb) => sub(() => cb({ ...st.settings })),
    watchElection: (eid, cb) => sub(() => cb(st.elections[eid] ? { ...st.elections[eid] } : null)),
    watchElections: (cb) => sub(() => cb(Object.values(st.elections).sort((a, b) => b.createdAt - a.createdAt).map((e) => ({ ...e })))),
    hasVoted: async (eid, uid) => (st.voters[eid] || []).some((v) => v.uid === uid),
    isMember: async (email) => st.members.some((m) => m.email === email),
    isAdmin: async (u) => u.email === OWNER || u.uid === "owner" || st.admins.some((a) => a.email === u.email),
    async castVote(eid, cid, user) {
      await wait(700);
      const e = st.elections[eid];
      if (e.status !== "open" || (st.voters[eid] || []).some((v) => v.uid === user.uid)) throw { code: "permission-denied" };
      st.tally[eid] = st.tally[eid] || {};
      st.tally[eid][cid] = (st.tally[eid][cid] || 0) + 1;
      (st.voters[eid] = st.voters[eid] || []).push({ uid: user.uid, email: user.email, name: user.name });
      emit();
    },
    watchTally: (eid, cb) => sub(() => cb({ ...(st.tally[eid] || {}) })),
    watchVoters: (eid, cb) => sub(() => cb([...(st.voters[eid] || [])])),
    watchMembers: (cb) => sub(() => cb([...st.members])),
    watchAdmins: (cb) => sub(() => cb([...st.admins])),
    async ensureSettings() {},
    async updateSettings(p) { Object.assign(st.settings, p); emit(); },
    async createElection(title, candidates) {
      const id = "e" + rid(4);
      st.elections[id] = { id, title, status: "draft", candidates, candidateIds: candidates.map((c) => c.id), resultsPublic: false, createdAt: Date.now() };
      emit(); return id;
    },
    async updateElection(eid, p) { Object.assign(st.elections[eid], p); emit(); },
    async openElection(e) {
      await wait();
      if (e.status === "draft") { st.tally[e.id] = {}; e.candidates.forEach((c) => (st.tally[e.id][c.id] = 0)); }
      st.elections[e.id].status = "open"; st.settings.activeElection = e.id; emit();
    },
    async closeElection(e) { await wait(); st.elections[e.id].status = "closed"; emit(); },
    async deleteElection(eid) { delete st.elections[eid]; if (st.settings.activeElection === eid) st.settings.activeElection = null; emit(); },
    async addMembers(list) { list.forEach((m) => { if (!st.members.some((x) => x.email === m.email)) st.members.push(m); }); emit(); },
    async removeMember(email) { st.members = st.members.filter((m) => m.email !== email); emit(); },
    async addAdmin(email) { if (!st.admins.some((a) => a.email === email)) st.admins.push({ email }); emit(); },
    async removeAdmin(email) { st.admins = st.admins.filter((a) => a.email !== email); emit(); },
  };
}

/* ── App shell ───────────────────────────────────── */
const root = document.getElementById("app");
let api = null;
let route = (/\/admin\/?$/.test(location.pathname) || location.hash === "#admin") ? "admin" : "vote";
let user;            // undefined = still checking, null = signed out
let unsubs = [];
const clearSubs = () => { unsubs.forEach((u) => { try { u(); } catch {} }); unsubs = []; };

function mast() {
  const who = user
    ? `<div class="who"><span title="${esc(user.email)}">${esc(user.email)}</span><button class="linkish" data-act="signout">বের হন</button></div>`
    : "";
  return `<header class="mast"><img src="${LOGO}" alt="${esc(ORG)} লোগো" width="44" height="44"><div class="org"><b>${esc(ORG)}</b><span>${esc(ORG_EN)}</span></div>${who}</header>`;
}
function demoBar() {
  if (!api?.demo) return "";
  return `<div class="demo-bar"><span><b>ডেমো মোড</b> — নমুনা নাম ও সংখ্যা, কিছুই সংরক্ষিত হয় না।</span>
    <span class="seg" role="group" aria-label="ভিউ বদলান"><button data-act="demo-view" data-v="vote" aria-pressed="${route === "vote"}">ভোটার</button><button data-act="demo-view" data-v="admin" aria-pressed="${route === "admin"}">অ্যাডমিন</button></span></div>`;
}
function signInButton(label = "Google দিয়ে প্রবেশ করুন") {
  return `<button class="btn primary block" data-act="signin" id="signin-btn">${ICON.google}<span>${label}</span></button>`;
}
function inAppNote() {
  if (!inAppBrowser()) return "";
  const url = location.href;
  const chrome = isAndroid() ? `<a class="btn sm" href="intent://${esc(url.replace(/^https?:\/\//, ""))}#Intent;scheme=https;package=com.android.chrome;end">Chrome-এ খুলুন</a>` : "";
  return `<div class="note warn">${ICON.info}<div>আপনি Facebook/Messenger-এর ভেতরের ব্রাউজারে আছেন। এখানে Google লগইন কাজ নাও করতে পারে। উপরের <b>⋮</b> মেনু থেকে <b>“Open in browser”</b> বেছে নিন।<div class="row-gap" style="margin-top:8px">${chrome}<button class="btn sm" data-act="copy-here">লিংক কপি করুন</button></div></div></div>`;
}

/* ═══════════════════ VOTER ═══════════════════ */
const V = { settings: undefined, election: undefined, eid: null, voted: null, member: null, checkedFor: "", selected: null, query: "", confirming: false, submitting: false, justVoted: false, tally: null, err: "" };

function startVoter() {
  clearSubs();
  Object.assign(V, { settings: undefined, election: undefined, eid: null, voted: null, member: null, checkedFor: "", selected: null, query: "", confirming: false, submitting: false, tally: null, err: "" });
  let electionUnsub = null, tallyUnsub = null;
  unsubs.push(() => { electionUnsub?.(); tallyUnsub?.(); });
  unsubs.push(api.watchSettings((s) => {
    V.settings = s || {};
    const eid = V.settings.activeElection || null;
    if (eid !== V.eid) {
      V.eid = eid; V.election = eid ? undefined : null; V.checkedFor = "";
      electionUnsub?.(); tallyUnsub?.(); tallyUnsub = null;
      if (eid) electionUnsub = api.watchElection(eid, (e) => {
        V.election = e;
        const wantTally = e && e.status === "closed" && e.resultsPublic;
        if (wantTally && !tallyUnsub) tallyUnsub = api.watchTally(eid, (t) => { V.tally = t; renderVoter(); }, () => {});
        if (!wantTally && tallyUnsub) { tallyUnsub(); tallyUnsub = null; V.tally = null; }
        checkVoter(); renderVoter();
      }, () => { V.election = null; renderVoter(); });
    }
    checkVoter(); renderVoter();
  }, () => { V.settings = {}; renderVoter(); }));
}

async function checkVoter() {
  if (!user || !V.election || V.election.status !== "open") return;
  const key = user.uid + "|" + V.election.id + "|" + !!V.settings?.restrict;
  if (V.checkedFor === key) return;
  V.checkedFor = key; V.voted = null; V.member = null;
  try {
    const [voted, member] = await Promise.all([
      api.hasVoted(V.election.id, user.uid),
      V.settings?.restrict ? api.isMember(user.email) : Promise.resolve(true),
    ]);
    if (V.checkedFor !== key) return;
    V.voted = voted; V.member = member;
  } catch (e) { V.err = errText(e); V.voted = false; V.member = true; }
  renderVoter();
}

function voterBody() {
  const e = V.election;
  if (V.settings === undefined || e === undefined || user === undefined) return `<div class="spin" aria-label="লোড হচ্ছে"></div>`;
  if (!e) return `<section class="head"><h1>এই মুহূর্তে কোনো নির্বাচন চলছে না</h1><p class="lede">নির্বাচন শুরু হলে এই একই লিংকে ভোট দিতে পারবেন।</p></section>`;

  const head = `<section class="head">${statusPill(e.status)}<h1>${esc(e.title)}</h1>`;
  if (e.status === "draft") return `${head}<p class="lede">ভোটগ্রহণ এখনও শুরু হয়নি। শুরু হলে এই লিংকেই ভোট দিতে পারবেন।</p></section>`;
  if (e.status === "closed") {
    if (V.justVoted) return head + "</section>" + receipt();
    const res = e.resultsPublic && V.tally ? `<div class="card"><div class="section-title"><h3>ফলাফল</h3><span>মোট ${bn(sumTally(V.tally))} ভোট</span></div>${resultsList(e, V.tally)}</div>` : "";
    return `${head}<p class="lede">ভোটগ্রহণ শেষ হয়েছে। ${e.resultsPublic ? "" : "ফলাফল শীঘ্রই প্রকাশ করা হবে।"}</p></section>${res}`;
  }

  // open
  if (!user) {
    return `${head}<p class="lede">আপনার Google অ্যাকাউন্ট দিয়ে প্রবেশ করে পছন্দের প্রার্থীকে একবার ভোট দিন। কোনো রেজিস্ট্রেশন লাগবে না।</p></section>
      <div class="stack">${inAppNote()}<div class="card stack">${signInButton()}
      <div class="note">${ICON.lock}<div>আপনি কাকে ভোট দিচ্ছেন তা কোথাও আপনার নামের সাথে সংরক্ষিত হয় না। অ্যাডমিনও তা দেখতে পারেন না।</div></div></div></div>`;
  }
  if (V.justVoted) return head + "</section>" + receipt(true);
  if (V.voted === null || V.member === null) return head + `</section><div class="spin" aria-label="যাচাই হচ্ছে"></div>`;
  if (!V.member) return `${head}</section><div class="card stack"><h2>এই ইমেইলটি ভোটার তালিকায় নেই</h2><p><b>${esc(user.email)}</b> দিয়ে এই নির্বাচনে ভোট দেওয়া যাবে না। সংগঠনে যে ইমেইল দিয়েছেন সেটি দিয়ে প্রবেশ করুন, অথবা পরিচালকের সাথে যোগাযোগ করুন।</p><div><button class="btn" data-act="signout">অন্য অ্যাকাউন্ট দিয়ে প্রবেশ করুন</button></div></div>`;
  if (V.voted) return head + "</section>" + receipt(false);

  const n = e.candidates.length;
  return `${head}<p class="lede">একজন প্রার্থী বেছে নিয়ে নিচের <b>ভোট দিন</b> বোতামে চাপুন। একবার ভোট দিলে আর বদলানো যাবে না।</p></section>
    ${V.err ? `<div class="note err" style="margin-bottom:12px">${ICON.info}<div>${esc(V.err)}</div></div>` : ""}
    <div class="ballot-tools">
      ${n > 8 ? `<label class="search">${ICON.search}<input id="q" type="search" placeholder="নাম দিয়ে খুঁজুন" value="${esc(V.query)}" autocomplete="off"></label>` : "<span></span>"}
      <span class="count-label">${bn(n)} জন প্রার্থী</span>
    </div>
    <ul class="ballot" id="ballot">${ballotRows()}</ul>`;
}

function ballotRows() {
  const q = V.query.trim().toLowerCase();
  const rows = V.election.candidates.map((c, i) => ({ ...c, i })).filter((c) => !q || c.name.toLowerCase().includes(q));
  if (!rows.length) return `<li class="empty-row">“${esc(V.query)}” নামে কোনো প্রার্থী পাওয়া যায়নি</li>`;
  return rows.map((c) => `<li><label class="cand"><input type="radio" name="cand" id="cand-${esc(c.id)}" value="${esc(c.id)}" ${V.selected === c.id ? "checked" : ""}><span class="no">${bn(c.i + 1)}</span><span class="nm">${esc(c.name)}</span><span class="seal" aria-hidden="true">ভোট</span></label></li>`).join("");
}

function receipt(fresh) {
  return `<div class="card receipt ${fresh ? "fresh" : ""}"><div class="big-seal">ভোট</div>
    <h2>${fresh ? "আপনার ভোট জমা হয়েছে" : "আপনি ইতিমধ্যে ভোট দিয়েছেন"}</h2>
    <p>${fresh ? "ধন্যবাদ। আপনি কাকে ভোট দিয়েছেন তা কোথাও সংরক্ষিত হয়নি, শুধু প্রার্থীর মোট ভোট এক বেড়েছে।" : `<b>${esc(user?.email || "")}</b> দিয়ে এই নির্বাচনে একবার ভোট দেওয়া হয়ে গেছে। এক অ্যাকাউন্ট থেকে একটিই ভোট দেওয়া যায়।`}</p>
    <div style="margin-top:18px"><button class="btn sm" data-act="signout">বের হন</button></div></div>`;
}

function actionBar() {
  const e = V.election;
  if (!e || e.status !== "open" || !user || V.voted !== false || !V.member || V.justVoted) return "";
  const c = e.candidates.find((x) => x.id === V.selected);
  return `<div class="actionbar"><div class="inner"><div class="pick">${c ? `আপনার পছন্দ<b>${esc(c.name)}</b>` : "এখনও কাউকে বাছাই করা হয়নি"}</div>
    <button class="btn primary" data-act="review" ${c ? "" : "disabled"}>ভোট দিন</button></div></div>`;
}

function confirmSheet() {
  if (!V.confirming) return "";
  const c = V.election.candidates.find((x) => x.id === V.selected);
  return `<div class="scrim" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cf-t">
    <div class="eyebrow" id="cf-t">${esc(V.election.title)} — আপনি ভোট দিচ্ছেন</div>
    <div class="choice">${esc(c?.name)}</div>
    <div class="note">${ICON.info}<div>জমা দেওয়ার পর ভোট আর বদলানো যাবে না।</div></div>
    <div class="actions"><button class="btn primary block" data-act="submit" id="submit-btn" ${V.submitting ? "disabled" : ""}>${V.submitting ? "জমা হচ্ছে…" : "নিশ্চিত করুন ও জমা দিন"}</button>
    <button class="btn block" data-act="cancel" ${V.submitting ? "disabled" : ""}>ফিরে যান</button></div></div></div>`;
}

function renderVoter() {
  if (route !== "vote") return;
  const searching = document.activeElement?.id === "q";
  root.innerHTML = demoBar() + `<main class="shell">${mast()}${voterBody()}<p class="foot">${esc(ORG)} · গোপন ব্যালট</p></main>${actionBar()}${confirmSheet()}`;
  if (V.confirming) $("#submit-btn")?.focus();
  else if (searching && $("#q")) { const q = $("#q"); q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch {} }
}

async function submitVote() {
  if (V.submitting) return;
  V.submitting = true; renderVoter();
  try {
    await api.castVote(V.election.id, V.selected, user);
    V.justVoted = true; V.confirming = false; V.voted = true;
  } catch (e) {
    V.confirming = false;
    try { V.voted = await api.hasVoted(V.election.id, user.uid); } catch {}
    V.err = V.voted ? "" : (e?.code?.includes("permission-denied") ? "ভোট জমা হয়নি। ভোটগ্রহণ বন্ধ হয়ে থাকতে পারে, পাতাটি আবার খুলে দেখুন।" : errText(e));
  }
  V.submitting = false; renderVoter();
}

/* ═══════════════════ ADMIN ═══════════════════ */
const A = { isAdmin: undefined, tab: "elections", settings: {}, elections: undefined, sel: null, voters: [], tally: null, members: [], admins: [], edit: null, confirm: null, busy: false, voterQ: "" };
let selUnsubs = [];
const clearSel = () => { selUnsubs.forEach((u) => u()); selUnsubs = []; };

async function startAdmin() {
  clearSubs(); clearSel();
  A.isAdmin = undefined; A.elections = undefined; A.edit = null; A.confirm = null;
  renderAdmin();
  if (!user) return;
  const ok = await api.isAdmin(user);
  if (!user) return;
  A.isAdmin = ok;
  if (!ok) return renderAdmin();
  try { await api.ensureSettings(); } catch {}
  unsubs.push(() => clearSel());
  unsubs.push(api.watchSettings((s) => { const prevLive = A.settings.liveResults; A.settings = s || {}; if (prevLive !== A.settings.liveResults) bindSelected(true); renderAdmin(); }, () => {}));
  unsubs.push(api.watchElections((list) => {
    A.elections = list;
    if (!A.sel || !list.some((e) => e.id === A.sel)) A.sel = A.settings.activeElection && list.some((e) => e.id === A.settings.activeElection) ? A.settings.activeElection : list[0]?.id || null;
    bindSelected(); renderAdmin();
  }, (e) => { toast(errText(e)); A.elections = []; renderAdmin(); }));
  unsubs.push(api.watchMembers((m) => { A.members = m.sort((a, b) => a.email.localeCompare(b.email)); renderAdmin(); }, () => {}));
  unsubs.push(api.watchAdmins((a) => { A.admins = a; renderAdmin(); }, () => {}));
}

let boundKey = "";
function bindSelected(force) {
  const e = selected();
  const canTally = e && e.status !== "draft" && (e.status === "closed" || A.settings.liveResults);
  const key = e ? `${e.id}|${e.status}|${canTally}` : "";
  if (key === boundKey && !force) return;
  boundKey = key; clearSel(); A.voters = []; A.tally = null;
  if (!e || e.status === "draft") return;
  selUnsubs.push(api.watchVoters(e.id, (v) => { A.voters = v; renderAdmin(); }, () => {}));
  if (canTally) selUnsubs.push(api.watchTally(e.id, (t) => { A.tally = t; renderAdmin(); }, () => { A.tally = null; }));
}
const selected = () => A.elections?.find((e) => e.id === A.sel) || null;
const sumTally = (t) => Object.values(t || {}).reduce((a, b) => a + b, 0);

function resultsList(e, tally) {
  const total = sumTally(tally);
  const rows = e.candidates.map((c) => ({ ...c, v: tally[c.id] || 0 })).sort((a, b) => b.v - a.v || collator.compare(a.name, b.name));
  const top = rows[0]?.v || 0;
  let rank = 0, prev = -1;
  return `<div class="results">${rows.map((r, i) => {
    if (r.v !== prev) { rank = i + 1; prev = r.v; }
    const pct = total ? Math.round((r.v / total) * 100) : 0;
    return `<div class="res ${top > 0 && r.v === top ? "lead" : ""}"><span class="rk">${bn(rank)}</span><span class="nm">${esc(r.name)}</span><span class="v">${bn(r.v)}<small>${bn(pct)}%</small></span><span class="bar"><i style="width:${top ? (r.v / top) * 100 : 0}%"></i></span></div>`;
  }).join("")}</div>`;
}

function adminBody() {
  if (user === undefined) return `<div class="spin"></div>`;
  if (!user) return `<section class="head"><span class="status">পরিচালনা</span><h1>অ্যাডমিন প্যানেল</h1><p class="lede">শুধু অনুমতিপ্রাপ্ত ইমেইল দিয়ে প্রবেশ করা যাবে।</p></section><div class="card stack" style="max-width:420px">${signInButton()}</div>`;
  if (A.isAdmin === undefined) return `<div class="spin"></div>`;
  if (!A.isAdmin) return `<section class="head"><h1>প্রবেশাধিকার নেই</h1><p class="lede"><b>${esc(user.email)}</b> এই প্যানেলের অ্যাডমিন হিসেবে যুক্ত নেই। মূল অ্যাডমিন আপনার ইমেইল যোগ করলে প্রবেশ করতে পারবেন।</p></section><button class="btn" data-act="signout">অন্য অ্যাকাউন্ট দিয়ে প্রবেশ করুন</button>`;
  const isOwner = user.email === OWNER || (api.demo && user.uid === "owner");
  const tabs = [["elections", "নির্বাচন"], ["voters", "ভোটার তালিকা"], ["admins", "অ্যাডমিন"]];
  return `<nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${A.tab === k}" data-act="tab" data-v="${k}">${l}</button>`).join("")}</nav>
    ${A.tab === "elections" ? electionsTab() : A.tab === "voters" ? votersTab() : adminsTab(isOwner)}`;
}

function electionsTab() {
  if (A.elections === undefined) return `<div class="spin"></div>`;
  const list = A.elections;
  const side = `<aside class="elist"><p class="lbl">সব নির্বাচন</p>
    ${list.map((e) => `<button class="eitem" data-act="pick" data-v="${e.id}" aria-current="${e.id === A.sel && !A.edit?.isNew}"><b>${esc(e.title)}</b>${statusPill(e.status)}</button>`).join("")}
    <button class="btn sm" data-act="new" style="margin-top:6px;align-self:flex-start">+ নতুন নির্বাচন</button></aside>`;
  let main;
  if (A.edit) main = editorPanel();
  else if (!selected()) main = `<div class="locked"><div><b>এখনও কোনো নির্বাচন তৈরি হয়নি</b>“নতুন নির্বাচন” চেপে পদের নাম ও প্রার্থীদের নাম দিন।</div></div>`;
  else main = electionPanel(selected());
  return `<div class="admin-grid">${side}<section class="panel">${main}</section></div>`;
}

function editorPanel() {
  const ed = A.edit;
  const names = parseNames(ed.text);
  const others = (A.elections || []).filter((e) => e.id !== ed.id && e.candidates?.length);
  return `<div class="panel-head"><div><span class="status">${ed.isNew ? "নতুন নির্বাচন" : "খসড়া সম্পাদনা"}</span><h2>${esc(ed.title || "পদের নাম দিন")}</h2></div></div>
    <div class="card stack">
      <div class="field"><label for="ed-title">পদের নাম / নির্বাচনের শিরোনাম</label><input class="input" id="ed-title" value="${esc(ed.title)}" placeholder="যেমন: সভাপতি নির্বাচন"></div>
      <div class="field"><label for="ed-names">প্রার্থীদের নাম <span style="font-weight:400;color:var(--ink-3)">· প্রতি লাইনে একজন</span></label>
        <textarea class="input" id="ed-names" placeholder="মোঃ আব্দুল করিম&#10;রফিকুল ইসলাম&#10;…">${esc(ed.text)}</textarea>
        <span class="hint" id="ed-count">${bn(names.length)} জন প্রার্থী${names.length !== new Set(names).size ? " · একই নাম একাধিকবার আছে" : ""}</span></div>
      ${others.length || A.members.some((m) => m.name) ? `<div class="row-gap"><span class="hint" style="font-size:12px;color:var(--ink-3)">নাম কপি করুন:</span>${A.members.some((m) => m.name) ? `<button class="btn sm" data-act="fill-members">ভোটার তালিকা থেকে</button>` : ""}${others.slice(0, 3).map((e) => `<button class="btn sm" data-act="fill-from" data-v="${e.id}">${esc(e.title)}</button>`).join("")}</div>` : ""}
      <div class="row-gap" style="justify-content:space-between"><button class="btn" data-act="ed-cancel">বাতিল</button><button class="btn primary" data-act="ed-save" ${A.busy ? "disabled" : ""}>সংরক্ষণ করুন</button></div>
    </div>`;
}
const parseNames = (t) => t.split("\n").map((s) => s.replace(/^\s*[\d০-৯]+[.)।]\s*/, "").trim()).filter(Boolean);

function electionPanel(e) {
  const isActive = A.settings.activeElection === e.id;
  const restrict = !!A.settings.restrict;
  const voted = A.voters.length;
  const pool = restrict ? A.members.length : 0;
  const head = `<div class="panel-head"><div>${statusPill(e.status)}${isActive ? ' <span class="status" style="margin-left:10px">· ভোটাররা এটি দেখছেন</span>' : ""}<h2>${esc(e.title)}</h2></div>
    <div class="row-gap">${actionsFor(e, isActive)}</div></div>`;

  if (e.status === "draft") {
    return head + `<div class="card stack"><div class="section-title"><h3>প্রার্থী</h3><span>${bn(e.candidates.length)} জন</span></div>
      <ol class="plain-list">${e.candidates.map((c, i) => `<li><div class="who"><b>${bn(i + 1)}. ${esc(c.name)}</b></div></li>`).join("")}</ol></div>
      <div class="note">${ICON.info}<div>ভোটগ্রহণ শুরু করলে প্রার্থী তালিকা আর বদলানো যাবে না। শুরু করার আগে নামগুলো আরেকবার মিলিয়ে নিন।</div></div>`;
  }

  const stats = `<div class="stats">
    <div class="stat"><div class="k">ভোট পড়েছে</div><div class="v">${bn(voted)}${pool ? `<small> / ${bn(pool)}</small>` : ""}</div>${pool ? `<div class="meter"><i style="width:${Math.min(100, (voted / pool) * 100)}%"></i></div>` : ""}</div>
    <div class="stat"><div class="k">প্রার্থী</div><div class="v">${bn(e.candidates.length)}</div></div>
    <div class="stat"><div class="k">কারা ভোট দিতে পারবেন</div><div class="v" style="font-size:16px;padding-top:8px">${restrict ? "শুধু তালিকার ইমেইল" : "লিংক পাওয়া যে কেউ"}</div></div></div>`;

  const share = e.status === "open" ? `<div><div class="section-title"><h3>ভোটারদের লিংক</h3><span>সবাইকে এই লিংকটি পাঠান</span></div>
    <div class="share"><code>${esc(voterLink())}</code><button class="btn sm primary" data-act="copy-link">কপি</button></div></div>` : "";

  let results;
  if (A.tally) {
    results = `<div class="card"><div class="section-title"><h3>${e.status === "open" ? "লাইভ ফলাফল" : "ফলাফল"}</h3><span>মোট ${bn(sumTally(A.tally))} ভোট</span></div>${resultsList(e, A.tally)}
      ${e.status === "closed" ? `<div class="toggle" style="border-top:1px solid var(--line-2);margin-top:8px"><div class="t"><b>ফলাফল ভোটারদের দেখান</b><span>চালু করলে ভোটারদের লিংকে ফলাফল দেখা যাবে।</span></div><label class="switch"><input type="checkbox" id="sw-public" data-act="sw-public" ${e.resultsPublic ? "checked" : ""} aria-label="ফলাফল প্রকাশ"><i></i></label></div>` : ""}</div>`;
  } else {
    results = `<div class="locked"><div>${ICON.lockBig}<b>ভোটগ্রহণ শেষ হলে ফলাফল খুলবে</b>গোপনীয়তা রক্ষায় ফলাফল এখন বন্ধ রাখা আছে।</div></div>`;
  }
  const liveToggle = e.status === "open" ? `<div class="toggle"><div class="t"><b>লাইভ ফলাফল দেখুন</b><span>চালু থাকলে অ্যাডমিনরা ভোট চলাকালীন সংখ্যা দেখবেন। কেউ ভোট দেওয়ার মুহূর্তে সংখ্যা বাড়তে দেখলে কে কাকে দিয়েছেন আন্দাজ করা যেতে পারে, তাই বন্ধ রাখাই নিরাপদ।</span></div><label class="switch"><input type="checkbox" id="sw-live" data-act="sw-live" ${A.settings.liveResults ? "checked" : ""} aria-label="লাইভ ফলাফল"><i></i></label></div>` : "";

  const vq = A.voterQ.trim().toLowerCase();
  const vlist = [...A.voters].sort((a, b) => collator.compare(a.name || a.email, b.name || b.email)).filter((v) => !vq || (v.name + " " + v.email).toLowerCase().includes(vq));
  const notYet = restrict ? A.members.filter((m) => !A.voters.some((v) => v.email === m.email)) : [];
  const voters = `<div class="card"><div class="section-title"><h3>যাঁরা ভোট দিয়েছেন</h3><span>${bn(voted)} জন · কাকে দিয়েছেন তা জানা যায় না</span></div>
    ${voted > 8 ? `<label class="search" style="margin-bottom:8px">${ICON.search}<input id="vq" type="search" placeholder="নাম বা ইমেইল খুঁজুন" value="${esc(A.voterQ)}"></label>` : ""}
    <div class="scroll-box"><ul class="plain-list" id="vlist">${vlist.length ? vlist.map((v) => `<li><div class="who"><b>${esc(v.name || "নাম নেই")}</b><span>${esc(v.email)}</span></div></li>`).join("") : `<li><div class="who"><span>এখনও কেউ ভোট দেননি</span></div></li>`}</ul></div>
    ${notYet.length ? `<details style="margin-top:12px"><summary style="cursor:pointer;font-size:13px;color:var(--ink-2)">এখনও ভোট দেননি: ${bn(notYet.length)} জন</summary><ul class="plain-list">${notYet.map((m) => `<li><div class="who"><b>${esc(m.name || m.email)}</b><span>${esc(m.email)}</span></div></li>`).join("")}</ul></details>` : ""}</div>`;

  return head + stats + share + `<div>${results}${liveToggle ? `<div style="margin-top:4px">${liveToggle}</div>` : ""}</div>` + voters;
}

function actionsFor(e, isActive) {
  const isOwner = user.email === OWNER || (api.demo && user.uid === "owner");
  const b = [];
  if (e.status === "draft") {
    b.push(`<button class="btn sm" data-act="edit">সম্পাদনা</button>`);
    if (isOwner) b.push(`<button class="btn sm danger" data-act="ask-delete">মুছুন</button>`);
    b.push(`<button class="btn sm primary" data-act="ask-open" ${e.candidates.length < 2 ? "disabled" : ""}>ভোটগ্রহণ শুরু করুন</button>`);
  } else if (e.status === "open") {
    if (!isActive) b.push(`<button class="btn sm" data-act="make-active">ভোটারদের এটি দেখান</button>`);
    b.push(`<button class="btn sm primary" data-act="ask-close">ভোটগ্রহণ শেষ করুন</button>`);
  } else {
    if (!isActive) b.push(`<button class="btn sm" data-act="make-active">ভোটারদের এটি দেখান</button>`);
    b.push(`<button class="btn sm" data-act="ask-reopen">আবার চালু করুন</button>`);
    if (isOwner) b.push(`<button class="btn sm danger" data-act="ask-delete">মুছুন</button>`);
  }
  return b.join("");
}

function votersTab() {
  const restrict = !!A.settings.restrict;
  return `<div style="padding-top:24px;max-width:680px" class="stack">
    <div class="card"><div class="toggle"><div class="t"><b>শুধু তালিকার ইমেইল ভোট দিতে পারবে</b><span>বন্ধ থাকলে লিংক পাওয়া যে কেউ তার Google অ্যাকাউন্ট দিয়ে একবার ভোট দিতে পারবে। চালু করলে নিচের তালিকার বাইরের কেউ ভোট দিতে পারবে না। একজন একাধিক Gmail দিয়ে ভোট দেওয়া ঠেকাতে এটি চালু রাখুন।</span></div><label class="switch"><input type="checkbox" id="sw-restrict" data-act="sw-restrict" ${restrict ? "checked" : ""} aria-label="ভোটার তালিকা চালু"><i></i></label></div></div>
    ${restrict && !A.members.length ? `<div class="note warn">${ICON.info}<div>তালিকা খালি থাকায় এখন কেউই ভোট দিতে পারবে না। নিচে সদস্যদের ইমেইল যোগ করুন।</div></div>` : ""}
    <div class="card stack"><div class="section-title"><h3>সদস্য যোগ করুন</h3><span>প্রতি লাইনে একজন: নাম, ইমেইল</span></div>
      <textarea class="input" id="mem-text" style="min-height:140px" placeholder="রফিকুল ইসলাম, rafiq@gmail.com&#10;শাহানা পারভীন, shahana@gmail.com"></textarea>
      <div class="row-gap" style="justify-content:space-between"><span class="hint" style="font-size:12px;color:var(--ink-3)" id="mem-hint">শুধু ইমেইল দিলেও চলবে।</span><button class="btn primary sm" data-act="add-members">তালিকায় যোগ করুন</button></div></div>
    <div class="card"><div class="section-title"><h3>ভোটার তালিকা</h3><span>${bn(A.members.length)} জন</span></div>
      <div class="scroll-box"><ul class="plain-list">${A.members.length ? A.members.map((m) => `<li><div class="who"><b>${esc(m.name || "—")}</b><span>${esc(m.email)}</span></div><button class="linkish" data-act="rm-member" data-v="${esc(m.email)}">বাদ দিন</button></li>`).join("") : `<li><div class="who"><span>তালিকায় এখনও কেউ নেই</span></div></li>`}</ul></div></div></div>`;
}

function adminsTab(isOwner) {
  return `<div style="padding-top:24px;max-width:680px" class="stack">
    <div class="card"><div class="section-title"><h3>মূল অ্যাডমিন</h3></div><ul class="plain-list"><li><div class="who"><b>${esc(OWNER || "—")}</b><span>সব নিয়ন্ত্রণ · অন্য অ্যাডমিন যোগ/বাদ দিতে পারেন</span></div></li></ul></div>
    ${isOwner ? `<div class="card stack"><div class="section-title"><h3>অ্যাডমিন যোগ করুন</h3><span>যাঁর Gmail দেবেন তিনি এই প্যানেলে ঢুকতে পারবেন</span></div>
      <div class="row-gap"><input class="input" id="adm-email" type="email" placeholder="name@gmail.com" style="flex:1;min-width:200px"><button class="btn primary sm" data-act="add-admin">যোগ করুন</button></div>
      <div class="note">${ICON.info}<div>অ্যাডমিনরা নির্বাচন চালু/বন্ধ ও ভোটার তালিকা দেখতে পারেন, কিন্তু কে কাকে ভোট দিয়েছেন তা দেখতে পারেন না, আর ভোটের সংখ্যাও বদলাতে পারেন না। প্যানেলের লিংক: <b>${esc(voterLink().replace(/\/$/, ""))}/admin</b></div></div></div>` : ""}
    <div class="card"><div class="section-title"><h3>অন্যান্য অ্যাডমিন</h3><span>${bn(A.admins.length)} জন</span></div>
      <ul class="plain-list">${A.admins.length ? A.admins.map((a) => `<li><div class="who"><b>${esc(a.email)}</b></div>${isOwner ? `<button class="linkish" data-act="rm-admin" data-v="${esc(a.email)}">বাদ দিন</button>` : ""}</li>`).join("") : `<li><div class="who"><span>আর কেউ যুক্ত নেই</span></div></li>`}</ul></div></div>`;
}

function adminConfirm() {
  const c = A.confirm; if (!c) return "";
  return `<div class="scrim" data-act="aconf-bg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ac-t">
    <div class="choice" id="ac-t" style="font-size:22px;margin-top:0">${c.title}</div><p style="margin:0;color:var(--ink-2)">${c.body}</p>
    <div class="actions"><button class="btn ${c.danger ? "danger" : "primary"} block" data-act="aconf-ok" id="aconf-ok" ${A.busy ? "disabled" : ""}>${A.busy ? "অপেক্ষা করুন…" : c.ok}</button><button class="btn block" data-act="aconf-no">বাতিল</button></div></div></div>`;
}

function renderAdmin() {
  if (route !== "admin") return;
  const keep = document.activeElement?.id;
  const edTitle = $("#ed-title")?.value, edNames = $("#ed-names")?.value;
  if (A.edit && edTitle !== undefined) { A.edit.title = edTitle; A.edit.text = edNames; }
  const scrollY = window.scrollY;
  root.innerHTML = demoBar() + `<main class="shell wide">${mast()}${adminBody()}</main>${adminConfirm()}`;
  window.scrollTo(0, scrollY);
  if (keep && document.getElementById(keep) && !A.confirm) {
    const el = document.getElementById(keep); el.focus();
    if (el.setSelectionRange && (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "search")) { const n = el.value.length; try { el.setSelectionRange(n, n); } catch {} }
  }
  if (A.confirm) $("#aconf-ok")?.focus();
}

async function adminRun(fn, okMsg) {
  A.busy = true; renderAdmin();
  try { await fn(); if (okMsg) toast(okMsg); A.confirm = null; }
  catch (e) { toast(errText(e)); }
  A.busy = false; renderAdmin();
}

/* ── Events ──────────────────────────────────────── */
root.addEventListener("click", async (ev) => {
  const t = ev.target.closest("[data-act]");
  if (!t) return;
  const act = t.dataset.act, v = t.dataset.v;
  if ((act === "sheet-bg" || act === "aconf-bg") && ev.target !== t) return;
  switch (act) {
    case "signin":
      t.disabled = true;
      if (api.demo) api.demoAs = route === "admin" ? "owner" : "member";
      try { await api.signIn(); } catch (e) { toast(errText(e)); }
      t.disabled = false; break;
    case "signout": V.justVoted = false; await api.signOut(); break;
    case "copy-here": copyText(location.href); break;
    case "demo-view":
      if (route === v) break;
      route = v; await api.signOut(); boot(); break;

    // voter
    case "review": if (V.selected) { V.confirming = true; renderVoter(); } break;
    case "cancel": case "sheet-bg": if (!V.submitting) { V.confirming = false; renderVoter(); } break;
    case "submit": submitVote(); break;

    // admin
    case "tab": A.tab = v; A.edit = null; renderAdmin(); break;
    case "pick": A.sel = v; A.edit = null; A.voterQ = ""; bindSelected(); renderAdmin(); break;
    case "new": A.edit = { isNew: true, title: "", text: "" }; renderAdmin(); $("#ed-title")?.focus(); break;
    case "edit": { const e = selected(); A.edit = { id: e.id, title: e.title, text: e.candidates.map((c) => c.name).join("\n") }; renderAdmin(); break; }
    case "ed-cancel": A.edit = null; renderAdmin(); break;
    case "fill-members": $("#ed-names").value = A.members.filter((m) => m.name).map((m) => m.name).join("\n"); $("#ed-names").dispatchEvent(new Event("input", { bubbles: true })); break;
    case "fill-from": { const e = A.elections.find((x) => x.id === v); $("#ed-names").value = e.candidates.map((c) => c.name).join("\n"); $("#ed-names").dispatchEvent(new Event("input", { bubbles: true })); break; }
    case "ed-save": {
      const title = $("#ed-title").value.trim();
      const names = [...new Set(parseNames($("#ed-names").value))];
      if (!title) { toast("পদের নাম লিখুন"); $("#ed-title").focus(); break; }
      if (names.length < 2) { toast("অন্তত দুজন প্রার্থীর নাম দিন"); $("#ed-names").focus(); break; }
      const ed = A.edit;
      const old = ed.isNew ? [] : selected().candidates;
      const candidates = names.map((name) => ({ id: old.find((c) => c.name === name)?.id || "c" + rid(7), name }));
      await adminRun(async () => {
        if (ed.isNew) { A.sel = await api.createElection(title, candidates); }
        else await api.updateElection(ed.id, { title, candidates, candidateIds: candidates.map((c) => c.id) });
        A.edit = null;
      }, "সংরক্ষিত হয়েছে");
      bindSelected(); renderAdmin(); break;
    }
    case "ask-open": { const e = selected(); A.confirm = { title: "ভোটগ্রহণ শুরু করবেন?", body: `“${esc(e.title)}”-এ ${bn(e.candidates.length)} জন প্রার্থী। শুরু করার পর প্রার্থী তালিকা আর বদলানো যাবে না, আর ভোটাররা লিংকে এই নির্বাচনটি দেখবেন।`, ok: "শুরু করুন", run: () => api.openElection(e), msg: "ভোটগ্রহণ শুরু হয়েছে" }; renderAdmin(); break; }
    case "ask-reopen": { const e = selected(); A.confirm = { title: "আবার ভোটগ্রহণ চালু করবেন?", body: "যাঁরা আগে ভোট দিয়েছেন তাঁরা আবার দিতে পারবেন না। আগের সব ভোট যেমন ছিল তেমনই থাকবে।", ok: "চালু করুন", run: () => api.openElection(e), msg: "আবার চালু হয়েছে" }; renderAdmin(); break; }
    case "ask-close": { const e = selected(); A.confirm = { title: "ভোটগ্রহণ শেষ করবেন?", body: `এখন পর্যন্ত ${bn(A.voters.length)} জন ভোট দিয়েছেন। শেষ করার পর আর কেউ ভোট দিতে পারবেন না এবং ফলাফল খুলে যাবে।`, ok: "শেষ করুন", run: () => api.closeElection(e), msg: "ভোটগ্রহণ শেষ হয়েছে" }; renderAdmin(); break; }
    case "ask-delete": { const e = selected(); A.confirm = { title: "নির্বাচনটি মুছবেন?", body: `“${esc(e.title)}” তালিকা থেকে মুছে যাবে। এটি ফেরানো যাবে না।`, ok: "মুছে ফেলুন", danger: true, run: async () => { await api.deleteElection(e.id); A.sel = null; }, msg: "মুছে ফেলা হয়েছে" }; renderAdmin(); break; }
    case "aconf-ok": { const c = A.confirm; await adminRun(c.run, c.msg); break; }
    case "aconf-no": case "aconf-bg": if (!A.busy) { A.confirm = null; renderAdmin(); } break;
    case "make-active": adminRun(() => api.updateSettings({ activeElection: A.sel }), "ভোটাররা এখন এই নির্বাচনটি দেখবেন"); break;
    case "copy-link": copyText(voterLink()); break;
    case "add-members": {
      const lines = $("#mem-text").value.split("\n").map((s) => s.trim()).filter(Boolean);
      const list = [], bad = [];
      lines.forEach((l) => { const m = l.match(EMAIL_RE); if (!m) return bad.push(l); list.push({ email: m[0].toLowerCase(), name: l.replace(m[0], "").replace(/[,;|<>\t]+/g, " ").trim() }); });
      if (!list.length) { toast("কোনো সঠিক ইমেইল পাওয়া যায়নি"); break; }
      await adminRun(() => api.addMembers(list), `${bn(list.length)} জন যোগ হয়েছে${bad.length ? ` · ${bn(bad.length)} লাইনে ইমেইল নেই` : ""}`);
      break;
    }
    case "rm-member": adminRun(() => api.removeMember(v), "বাদ দেওয়া হয়েছে"); break;
    case "add-admin": {
      const em = ($("#adm-email").value.match(EMAIL_RE) || [""])[0].toLowerCase();
      if (!em) { toast("সঠিক ইমেইল লিখুন"); break; }
      if (em === OWNER) { toast("ইনি ইতিমধ্যে মূল অ্যাডমিন"); break; }
      adminRun(() => api.addAdmin(em), "অ্যাডমিন যোগ হয়েছে"); break;
    }
    case "rm-admin": adminRun(() => api.removeAdmin(v), "অ্যাডমিন বাদ দেওয়া হয়েছে"); break;
  }
});

root.addEventListener("change", (ev) => {
  const t = ev.target;
  if (t.name === "cand") { V.selected = t.value; V.err = ""; const bar = $(".actionbar"); if (bar) bar.outerHTML = actionBar(); else root.insertAdjacentHTML("beforeend", actionBar()); return; }
  if (t.dataset.act === "sw-live") adminRun(() => api.updateSettings({ liveResults: t.checked }), t.checked ? "লাইভ ফলাফল চালু" : "লাইভ ফলাফল বন্ধ");
  if (t.dataset.act === "sw-restrict") adminRun(() => api.updateSettings({ restrict: t.checked }), t.checked ? "শুধু তালিকার ইমেইল ভোট দিতে পারবে" : "লিংক পাওয়া যে কেউ ভোট দিতে পারবে");
  if (t.dataset.act === "sw-public") adminRun(() => api.updateElection(A.sel, { resultsPublic: t.checked }), t.checked ? "ফলাফল প্রকাশ করা হয়েছে" : "ফলাফল লুকানো হয়েছে");
});

root.addEventListener("input", (ev) => {
  const t = ev.target;
  if (t.id === "q") { V.query = t.value; $("#ballot").innerHTML = ballotRows(); }
  if (t.id === "vq") { A.voterQ = t.value; const sy = window.scrollY; renderAdmin(); window.scrollTo(0, sy); }
  if (t.id === "ed-names") { const n = parseNames(t.value); $("#ed-count").textContent = `${bn(n.length)} জন প্রার্থী${n.length !== new Set(n).size ? " · একই নাম একাধিকবার আছে" : ""}`; }
  if (t.id === "ed-title" && A.edit) { A.edit.title = t.value; }
});

document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  if (V.confirming && !V.submitting) { V.confirming = false; renderVoter(); }
  if (A.confirm && !A.busy) { A.confirm = null; renderAdmin(); }
});
window.addEventListener("hashchange", () => {
  const r = location.hash === "#admin" || /\/admin\/?$/.test(location.pathname) ? "admin" : "vote";
  if (r !== route) { route = r; boot(); }
});

/* ── Boot ────────────────────────────────────────── */
let authUnsub = null;
function boot() {
  document.title = route === "admin" ? `অ্যাডমিন · ${ORG}` : `নির্বাচন · ${ORG}`;
  authUnsub?.();
  user = undefined;
  route === "admin" ? (A.isAdmin = undefined, renderAdmin()) : (startVoter(), renderVoter());
  authUnsub = api.onAuth((u) => {
    user = u || null;
    if (route === "admin") startAdmin();
    else { V.checkedFor = ""; if (!user) V.justVoted = false; checkVoter(); renderVoter(); }
  });
}

(async function init() {
  root.innerHTML = `<main class="shell">${mast()}<div class="spin"></div></main>`;
  try { api = DEMO ? demoBackend() : await firebaseBackend(); }
  catch (e) { root.innerHTML = `<main class="shell">${mast()}<section class="head"><h1>সংযোগ করা যায়নি</h1><p class="lede">ইন্টারনেট সংযোগ দেখে পাতাটি আবার খুলুন।</p></section></main>`; return; }
  boot();
})();

(() => {
  "use strict";

  const DEFAULT_CONFIG = {
    appName: "Tuition Master",
    supabaseUrl: "https://ejsmrureupknqcnzbrpd.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc21ydXJldXBrbnFjbnpicnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTMxMzAsImV4cCI6MjA5NDc4OTEzMH0.LakY-4cdx7H2fELet2wdt6ckeomzQ3ArwiTSTvuzI40",
    adminEmails: ["skfuad502@gmail.com"],
    bkashNumber: "0151505475",
    studentServiceFeeRate: 0.10,
    teacherCommissionRate: 0.20
  };

  const State = {
    config: DEFAULT_CONFIG,
    client: null,
    user: null,
    profile: null,
    teachers: [],
    requests: [],
    activeRequestId: null,
    activeRequest: null,
    chatChannel: null,
    authMode: "login",
    language: localStorage.getItem("tm_language") || "en",
    useBengaliNumerals: localStorage.getItem("tm_bn_num") === "true",
    notificationInterval: null,
    mediaRecorder: null,
    audioChunks: [],
    searchHistory: JSON.parse(localStorage.getItem("tm_search_history") || "[]"),
    locations: null,
    deferredInstall: null
  };

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const fmtMoney = v => `৳${Number(v||0).toLocaleString("en-BD")}`;
  const fmtDate = v => v ? new Date(v).toLocaleString("en-BD",{dateStyle:"medium",timeStyle:"short"}) : "—";
  const initials = n => (n||"TM").trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()).join("")||"TM";
  const csvToArray = v => v.split(",").map(s=>s.trim()).filter(Boolean);
  const safeText = v => String(v??"").replace(/[&<<>'"]/g, c=>({"&":"&amp;","<<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

  // Bengali numeral converter
  const toBnNum = str => {
    if (!State.useBengaliNumerals) return str;
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(str).replace(/[0-9]/g, w => bn[+w]);
  };

  // i18n translations
  const i18n = {
    en: {
      brandName:"Tuition Master", brandTag:"Verified tutor network", navHome:"Home", navTeachers:"Teachers",
      navDashboard:"Dashboard", navChat:"Chat", navAdmin:"Admin", installApp:"Install App", logout:"Logout",
      loginSignup:"Login / Signup", heroEyebrow:"Bangladesh's smart tuition platform",
      heroTitle:"Find verified tutors faster. Manage tuition smarter.",
      heroDesc:"Tuition Master connects students, parents, and qualified teachers through secure profiles, transparent bKash verification, realtime chat, schedules, attendance, and study materials.",
      exploreTeachers:"Explore Teachers", joinNow:"Join Tuition Master", metricTeachers:"Teachers",
      metricFee:"Student service fee", metricCommission:"Teacher commission", verifiedBadge:"Admin verified",
      trustedProfile:"Trusted tutor profile", premiumMatch:"Premium Match", previewTitle:"Physics Tutor for HSC",
      previewDesc:"Dhaka • 5 years experience • ৳5,000/month", requestTutor:"Request Tutor",
      realtimeChat:"Realtime chat", safeComm:"Safe communication before sharing personal contact",
      featVerify:"Verified Profiles", featVerifyDesc:"Admin approval keeps teacher data reliable.",
      featPayment:"Payment Tracking", featPaymentDesc:"Manual bKash transaction verification.",
      featTools:"Learning Tools", featToolsDesc:"Schedule, attendance, materials, and chat.",
      teachersEyebrow:"Find your best match", teachersTitle:"Search verified teachers",
      teachersDesc:"Filter by subject, district, upazila, and class level.", recentSearches:"Recent:",
      clearAll:"Clear all", labelDivision:"Division", anyDivision:"Any division", labelDistrict:"District",
      anyDistrict:"Any district", labelUpazila:"Upazila", anyUpazila:"Any upazila", labelSubject:"Subject",
      subjectPlaceholder:"Physics, Math...", labelClass:"Class level", anyClass:"Any class", searchBtn:"Search",
      navProfile:"Profile", navRequests:"Requests & Payments", navSchedule:"Schedule",
      navAttendance:"Attendance", navMaterials:"Materials", myProfile:"My Profile",
      completeProfile:"Complete your profile", labelFullName:"Full name", labelEmail:"Email",
      labelPhone:"Phone", labelRole:"Role", roleStudent:"Student", roleTeacher:"Teacher",
      labelSubjects:"Subjects", labelClassLevels:"Class levels", labelFee:"Monthly fee (৳)",
      labelExp:"Experience years", labelQualification:"Qualification", labelAvailability:"Availability",
      labelBio:"Bio", saveProfile:"Save Profile", dangerZone:"Danger Zone", deleteAccount:"Delete My Account",
      requestsTitle:"Requests & Payments", requestsDesc:"Track tuition requests", refresh:"Refresh",
      scheduleTitle:"Schedule", showAll:"All", showToday:"Today", labelTitle:"Title", labelStart:"Start time",
      labelEnd:"End time", labelNotes:"Notes", addSchedule:"Add Schedule", attendanceTitle:"Attendance",
      markAllPresent:"Mark All Present", markAllAbsent:"Mark All Absent", labelDate:"Date",
      labelStatus:"Status", statusPresent:"Present", statusAbsent:"Absent", statusLate:"Late",
      saveAttendance:"Save Attendance", thDate:"Date", thStatus:"Status", thNotes:"Notes",
      materialsTitle:"Study Materials", labelFile:"File", uploadMaterial:"Upload Material",
      chatEyebrow:"Secure communication", chatTitle:"Realtime tuition chat",
      chatDesc:"Send text, images, or voice messages.", typeMessage:"Type your message...", send:"Send",
      stop:"Stop", adminEyebrow:"Control center", adminTitle:"Admin Dashboard",
      adminDesc:"Approve teachers, verify payments, monitor conversations, export data.",
      tabPending:"Pending Approvals", tabTeachers:"All Teachers", tabStudents:"All Students",
      tabSessions:"Sessions", tabMonitor:"Conversation Monitor", tabRevenue:"Revenue",
      rateTeacher:"Rate Teacher", labelReview:"Review", submitRating:"Submit Rating",
      welcomeBack:"Welcome back", loginDesc:"Login to manage requests.", login:"Login", signup:"Signup",
      labelPassword:"Password", loginBtn:"Login", resetPassword:"Send password reset email",
      requestTeacher:"Request Teacher", labelScheduleNote:"Schedule note", labelBkashTrx:"bKash Transaction ID",
      submitRequest:"Submit Request", close:"Close", verifyEmailMsg:"Please verify your email to access all features.",
      resendEmail:"Resend Email"
    },
    bn: {
      brandName:"টিউশন মাস্টার", brandTag:"ভেরিফাইড টিউটর নেটওয়ার্ক", navHome:"হোম", navTeachers:"শিক্ষকগণ",
      navDashboard:"ড্যাশবোর্ড", navChat:"চ্যাট", navAdmin:"অ্যাডমিন", installApp:"অ্যাপ ইনস্টল করুন", logout:"লগআউট",
      loginSignup:"লগইন / সাইনআপ", heroEyebrow:"বাংলাদেশের স্মার্ট টিউশন প্ল্যাটফর্ম",
      heroTitle:"ভেরিফাইড শিক্ষক দ্রুত খুঁজুন। টিউশন স্মার্টলি ম্যানেজ করুন।",
      heroDesc:"টিউশন মাস্টার শিক্ষার্থী, অভিভাবক এবং যোগ্য শিক্ষকদের নিরাপদ প্রোফাইল, স্বচ্ছ বিকাশ যাচাইকরণ, রিয়েলটাইম চ্যাট, সময়সূচি, উপস্থিতি এবং স্টাডি ম্যাটেরিয়ালসের মাধ্যমে সংযুক্ত করে।",
      exploreTeachers:"শিক্ষক খুঁজুন", joinNow:"টিউশন মাস্টারে যোগ দিন", metricTeachers:"শিক্ষক",
      metricFee:"স্টুডেন্ট সার্ভিস ফি", metricCommission:"শিক্ষক কমিশন", verifiedBadge:"অ্যাডমিন ভেরিফাইড",
      trustedProfile:"বিশ্বস্ত শিক্ষক প্রোফাইল", premiumMatch:"প্রিমিয়াম ম্যাচ", previewTitle:"এইচএসসির জন্য পদার্থবিদ্যা টিউটর",
      previewDesc:"ঢাকা • ৫ বছরের অভিজ্ঞতা • ৳৫,০০০/মাস", requestTutor:"টিউটর রিকোয়েস্ট করুন",
      realtimeChat:"রিয়েলটাইম চ্যাট", safeComm:"ব্যক্তিগত যোগাযোগ শেয়ার করার আগে নিরাপদ যোগাযোগ",
      featVerify:"ভেরিফাইড প্রোফাইল", featVerifyDesc:"অ্যাডমিন অনুমোদন শিক্ষকের তথ্য নির্ভরযোগ্য রাখে।",
      featPayment:"পেমেন্ট ট্র্যাকিং", featPaymentDesc:"ম্যানুয়াল বিকাশ লেনদেন যাচাইকরণ।",
      featTools:"লার্নিং টুলস", featToolsDesc:"সময়সূচি, উপস্থিতি, ম্যাটেরিয়ালস এবং চ্যাট।",
      teachersEyebrow:"আপনার সেরা ম্যাচ খুঁজুন", teachersTitle:"ভেরিফাইড শিক্ষক খুঁজুন",
      teachersDesc:"বিষয়, জেলা, উপজেলা এবং শ্রেণি লেভেল দিয়ে ফিল্টার করুন।", recentSearches:"সাম্প্রতিক:",
      clearAll:"সব মুছুন", labelDivision:"বিভাগ", anyDivision:"যেকোনো বিভাগ", labelDistrict:"জেলা",
      anyDistrict:"যেকোনো জেলা", labelUpazila:"উপজেলা", anyUpazila:"যেকোনো উপজেলা", labelSubject:"বিষয়",
      subjectPlaceholder:"পদার্থবিজ্ঞান, গণিত...", labelClass:"শ্রেণি", anyClass:"যেকোনো শ্রেণি", searchBtn:"খুঁজুন",
      navProfile:"প্রোফাইল", navRequests:"রিকোয়েস্ট ও পেমেন্ট", navSchedule:"সময়সূচি",
      navAttendance:"উপস্থিতি", navMaterials:"ম্যাটেরিয়ালস", myProfile:"আমার প্রোফাইল",
      completeProfile:"আপনার প্রোফাইল সম্পূর্ণ করুন", labelFullName:"পুরো নাম", labelEmail:"ইমেইল",
      labelPhone:"ফোন", labelRole:"ভূমিকা", roleStudent:"শিক্ষার্থী", roleTeacher:"শিক্ষক",
      labelSubjects:"বিষয়সমূহ", labelClassLevels:"শ্রেণিসমূহ", labelFee:"মাসিক ফি (৳)",
      labelExp:"অভিজ্ঞতার বছর", labelQualification:"যোগ্যতা", labelAvailability:"প্রাপ্যতা",
      labelBio:"বায়ো", saveProfile:"প্রোফাইল সংরক্ষণ", dangerZone:"ডেঞ্জার জোন", deleteAccount:"আমার অ্যাকাউন্ট মুছুন",
      requestsTitle:"রিকোয়েস্ট ও পেমেন্ট", requestsDesc:"টিউশন রিকোয়েস্ট ট্র্যাক করুন", refresh:"রিফ্রেশ",
      scheduleTitle:"সময়সূচি", showAll:"সব", showToday:"আজকের", labelTitle:"শিরোনাম", labelStart:"শুরুর সময়",
      labelEnd:"শেষের সময়", labelNotes:"নোট", addSchedule:"সময়সূচি যোগ করুন", attendanceTitle:"উপস্থিতি",
      markAllPresent:"সবাইকে উপস্থিত চিহ্নিত করুন", markAllAbsent:"সবাইকে অনুপস্থিত চিহ্নিত করুন", labelDate:"তারিখ",
      labelStatus:"স্ট্যাটাস", statusPresent:"উপস্থিত", statusAbsent:"অনুপস্থিত", statusLate:"বিলম্বিত",
      saveAttendance:"উপস্থিতি সংরক্ষণ", thDate:"তারিখ", thStatus:"স্ট্যাটাস", thNotes:"নোট",
      materialsTitle:"স্টাডি ম্যাটেরিয়ালস", labelFile:"ফাইল", uploadMaterial:"ম্যাটেরিয়াল আপলোড",
      chatEyebrow:"নিরাপদ যোগাযোগ", chatTitle:"রিয়েলটাইম টিউশন চ্যাট",
      chatDesc:"টেক্সট, ছবি বা ভয়েস মেসেজ পাঠান।", typeMessage:"আপনার মেসেজ লিখুন...", send:"পাঠান",
      stop:"থামুন", adminEyebrow:"কন্ট্রোল সেন্টার", adminTitle:"অ্যাডমিন ড্যাশবোর্ড",
      adminDesc:"শিক্ষক অনুমোদন, পেমেন্ট যাচাই, কথোপকথন মনিটর, ডেটা এক্সপোর্ট।",
      tabPending:"পেন্ডিং অনুমোদন", tabTeachers:"সব শিক্ষক", tabStudents:"সব শিক্ষার্থী",
      tabSessions:"সেশনসমূহ", tabMonitor:"কথোপকথন মনিটর", tabRevenue:"রাজস্ব",
      rateTeacher:"শিক্ষককে রেটিং দিন", labelReview:"রিভিউ", submitRating:"রেটিং জমা দিন",
      welcomeBack:"ফিরে আসার জন্য স্বাগতম", loginDesc:"রিকোয়েস্ট ম্যানেজ করতে লগইন করুন।", login:"লগইন", signup:"সাইনআপ",
      labelPassword:"পাসওয়ার্ড", loginBtn:"লগইন", resetPassword:"পাসওয়ার্ড রিসেট ইমেইল পাঠান",
      requestTeacher:"শিক্ষক রিকোয়েস্ট করুন", labelScheduleNote:"সময়সূচি নোট", labelBkashTrx:"বিকাশ ট্রানজেকশন আইডি",
      submitRequest:"রিকোয়েস্ট জমা দিন", close:"বন্ধ", verifyEmailMsg:"সব ফিচার ব্যবহার করতে আপনার ইমেইল ভেরিফাই করুন।",
      resendEmail:"ইমেইল পুনরায় পাঠান"
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    await loadConfig();
    initSupabase();
    bindEvents();
    await registerServiceWorker();
    await loadLocations();
    initI18n();
    initNumerals();
    initPWA();
    routeTo(location.hash.replace("#","")||"home");
    await restoreSession();
    await loadTeacherCount();
    loadTemperature();
    startNotificationPolling();
    initSearchHistory();
    initRatingSystem();
    initVoiceRecorder();
  }

  async function loadConfig() {
    try {
      const res = await fetch("app-config.json", {cache:"no-store"});
      if(res.ok) State.config = {...DEFAULT_CONFIG, ...(await res.json())};
    } catch(e) { State.config = DEFAULT_CONFIG; }
  }

  function initSupabase() {
    const {supabaseUrl, supabaseAnonKey} = State.config;
    const looksConfigured = supabaseUrl?.startsWith("https") && !supabaseUrl.includes("YOUR_PROJECT_REF") && !supabaseAnonKey.includes("YOUR_SUPABASE");
    if(!window.supabase || !looksConfigured) { console.warn("Supabase not configured"); return; }
    State.client = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
    State.client.auth.onAuthStateChange(async (_,session) => {
      State.user = session?.user || null;
      await loadUserData();
      updateAuthUI();
    });
  }

  async function registerServiceWorker() {
    if("serviceWorker" in navigator) try{ await navigator.serviceWorker.register("sw.js"); }catch(e){}
  }

  function initPWA() {
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      State.deferredInstall = e;
      const btn = $("#installBtn");
      if(btn) { btn.hidden = false; btn.addEventListener("click", () => { State.deferredInstall.prompt(); State.deferredInstall = null; btn.hidden = true; }); }
    });
  }

  function initI18n() {
    applyLanguage();
  }

  function applyLanguage() {
    const t = i18n[State.language] || i18n.en;
    document.documentElement.lang = State.language === "bn" ? "bn" : "en";
    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if(t[key]) el.textContent = t[key];
    });
    $$("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if(t[key]) el.placeholder = t[key];
    });
    $("#langToggle").textContent = State.language === "bn" ? "English" : "বাংলা";
  }

  function initNumerals() {
    $("#numToggle").textContent = State.useBengaliNumerals ? "123" : "১২৩";
    $("#numToggle")?.addEventListener("click", () => {
      State.useBengaliNumerals = !State.useBengaliNumerals;
      localStorage.setItem("tm_bn_num", State.useBengaliNumerals);
      initNumerals();
      applyLanguage();
      if(State.teachers.length) renderTeachers();
      loadSchedules(); loadAttendance();
    });
  }

  async function loadLocations() {
    try {
      const res = await fetch("data/bd-locations.json");
      State.locations = await res.json();
      populateDivisionFilter();
    } catch(e) {
      State.locations = null;
    }
  }

  function populateDivisionFilter() {
    const sel = $("#filterDivision"); if(!sel || !State.locations) return;
    sel.innerHTML = `<option value="">${i18n[State.language].anyDivision}</option>`;
    Object.keys(State.locations).forEach(div => {
      const opt = document.createElement("option");
      opt.value = div; opt.textContent = div;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      const div = sel.value;
      const dSel = $("#filterDistrict");
      dSel.innerHTML = `<option value="">${i18n[State.language].anyDistrict}</option>`;
      $("#filterUpazila").innerHTML = `<option value="">${i18n[State.language].anyUpazila}</option>`;
      if(div && State.locations[div]) {
        Object.keys(State.locations[div]).forEach(dist => {
          const opt = document.createElement("option");
          opt.value = dist; opt.textContent = dist;
          dSel.appendChild(opt);
        });
      }
    });
    $("#filterDistrict")?.addEventListener("change", () => {
      const div = $("#filterDivision").value;
      const dist = $("#filterDistrict").value;
      const uSel = $("#filterUpazila");
      uSel.innerHTML = `<option value="">${i18n[State.language].anyUpazila}</option>`;
      if(div && dist && State.locations[div]?.[dist]) {
        State.locations[div][dist].forEach(upa => {
          const opt = document.createElement("option");
          opt.value = upa; opt.textContent = upa;
          uSel.appendChild(opt);
        });
      }
    });
  }

  function bindEvents() {
    $$('[data-route]').forEach(l=>l.addEventListener("click",e=>{e.preventDefault(); routeTo(l.dataset.route);}));
    window.addEventListener("hashchange",()=>routeTo(location.hash.replace("#","")||"home"));
    $("#menuBtn")?.addEventListener("click",()=>$(".main-nav")?.classList.toggle("open"));
    $("#themeToggle")?.addEventListener("click",toggleTheme);
    $("#langToggle")?.addEventListener("click",toggleLanguage);
    $("#openAuthBtn")?.addEventListener("click",()=>openAuth("login"));
    $("#heroJoinBtn")?.addEventListener("click",()=>openAuth("signup"));
    $("#logoutBtn")?.addEventListener("click",logout);
    $("#deleteAccountBtn")?.addEventListener("click",deleteAccount);
    $("#resendVerifyBtn")?.addEventListener("click",resendVerification);
    $("#authModal .close-btn")?.addEventListener("click",()=>$("#authModal")?.close());
    $("#requestModal .close-btn")?.addEventListener("click",()=>$("#requestModal")?.close());
    $("#ratingModal .close-btn")?.addEventListener("click",()=>$("#ratingModal")?.close());
    $$("[data-auth-mode]").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.authMode)));
    $("#authForm")?.addEventListener("submit",handleAuthSubmit);
    $("#resetPasswordBtn")?.addEventListener("click",resetPassword);
    $("#searchTeachersBtn")?.addEventListener("click",()=>{ saveSearchHistory(); loadTeachers(); });
    ["#filterSubject","#filterDistrict","#filterClass","#filterDivision","#filterUpazila"].forEach(id=>$(id)?.addEventListener("input",debounce(()=>{ saveSearchHistory(); loadTeachers(); },350)));
    $("#clearHistoryBtn")?.addEventListener("click",clearSearchHistory);
    $("#requestForm")?.addEventListener("submit",submitTeacherRequest);
    $("#profileForm")?.addEventListener("submit",saveProfile);
    $("#refreshRequestsBtn")?.addEventListener("click",loadRequests);
    $$(".side-nav button").forEach(b=>b.addEventListener("click",()=>switchPanel(b.dataset.panel)));
    $("#scheduleForm")?.addEventListener("submit",saveSchedule);
    $("#attendanceForm")?.addEventListener("submit",saveAttendance);
    $("#materialForm")?.addEventListener("submit",uploadMaterial);
    $("#messageForm")?.addEventListener("submit",sendMessage);
    $("#loadAdminBtn")?.addEventListener("click",loadAdminDashboard);
    $("#exportCsvBtn")?.addEventListener("click",exportProfilesCsv);
    $("#calendarBtn")?.addEventListener("click",showCalendar);
    $("#attachImageBtn")?.addEventListener("click",()=>$("#imageInput")?.click());
    $("#imageInput")?.addEventListener("change",handleImageUpload);
    $("#showAllSchedule")?.addEventListener("click",()=>{ setScheduleFilter("all"); });
    $("#showTodaySchedule")?.addEventListener("click",()=>{ setScheduleFilter("today"); });
    $("#bulkPresentBtn")?.addEventListener("click",()=>bulkAttendance("present"));
    $("#bulkAbsentBtn")?.addEventListener("click",()=>bulkAttendance("absent"));
    $$("[data-admin-tab]").forEach(btn=>btn.addEventListener("click",()=>switchAdminTab(btn.dataset.adminTab)));
    $("#submitRatingBtn")?.addEventListener("click",submitRating);
  }

  async function restoreSession() {
    if(!requireClient(false)) { updateAuthUI(); return; }
    const {data,error} = await State.client.auth.getSession();
    if(error) toast(error.message,"error");
    State.user = data?.session?.user || null;
    await loadUserData();
    updateAuthUI();
  }

  function requireClient(show=true) { if(State.client) return true; if(show) toast("Supabase connect হয়নি।","error"); return false; }
  function requireUser() { if(State.user) return true; openAuth("login"); toast("আগে login করুন","error"); return false; }
  function isAdmin() { const email=State.user?.email?.toLowerCase(); const adminEmails=State.config.adminEmails?.map(e=>e.toLowerCase())||[]; return Boolean(email && (adminEmails.includes(email) || State.profile?.role==="admin")); }

  function routeTo(route) {
    const valid=route||"home";
    const blocked=valid==="admin" && !isAdmin();
    const next=blocked?"home":valid;
    $$(".page").forEach(p=>p.classList.toggle("page-active",p.dataset.page===next));
    $$(".main-nav a").forEach(l=>l.classList.toggle("active",l.dataset.route===next));
    location.hash=next;
    $(".main-nav")?.classList.remove("open");
    if(next==="teachers") loadTeachers();
    if(next==="dashboard") loadDashboard();
    if(next==="chat") loadChatRooms();
    if(next==="admin" && isAdmin()) loadAdminDashboard();
  }

  function toggleTheme() {
    const html=document.documentElement;
    const next=html.dataset.theme==="dark"?"light":"dark";
    html.dataset.theme=next;
    localStorage.setItem("tm_theme",next);
    $("#themeToggle").textContent=next==="dark"?"☀":"☾";
  }

  function toggleLanguage() {
    State.language=State.language==="en"?"bn":"en";
    localStorage.setItem("tm_language",State.language);
    applyLanguage();
    toast(State.language==="bn"?"বাংলা mode চালু":"English mode enabled","success");
  }

  async function loadUserData() {
    if(!State.user||!State.client) { State.profile=null; return; }
    const {data,error}=await State.client.from("profiles").select("*").eq("id",State.user.id).maybeSingle();
    if(error && error.code!=="PGRST116") toast(error.message,"error");
    State.profile=data||null;
    await loadRequests(); await loadSchedules(); await loadAttendance(); await loadMaterials();
    checkEmailVerification();
  }

  function checkEmailVerification() {
    const banner = $("#verifyBanner");
    if(!banner || !State.user) { banner.hidden = true; return; }
    const verified = State.user.email_confirmed_at || State.user.confirmed_at;
    banner.hidden = !!verified;
  }

  async function resendVerification() {
    if(!requireClient() || !State.user) return;
    const {error} = await State.client.auth.resend({type: 'signup', email: State.user.email});
    if(error) toast(error.message, "error");
    else toast("Verification email sent!", "success");
  }

  function updateAuthUI() {
    const loggedIn=Boolean(State.user);
    $("#openAuthBtn").hidden=loggedIn;
    $("#logoutBtn").hidden=!loggedIn;
    $("#installBtn").hidden = !State.deferredInstall || loggedIn;
    $$('[data-admin-link]').forEach(l=>l.hidden=!isAdmin());
    const name=State.profile?.full_name||State.user?.email||"Guest";
    $("#profileName").textContent=name;
    $("#profileRole").textContent=State.profile?`${capitalize(State.profile.role)} • ${State.profile.district||"No district"}`:"Login to manage";
    $("#profileAvatar").textContent=initials(name);
    $("#profileStatus").textContent=State.profile?.status||"Not connected";
    $("#profileStatus").className=`pill ${State.profile?.status==="approved"?"success":State.profile?.status==="rejected"?"danger":"warning"}`;
    fillProfileForm();
  }

  function openAuth(mode) { setAuthMode(mode); $("#authModal")?.showModal(); }
  function setAuthMode(mode) {
    State.authMode=mode;
    $$("[data-auth-mode]").forEach(b=>b.classList.toggle("active",b.dataset.authMode===mode));
    $("#signupFields").hidden=mode!=="signup";
    const t = i18n[State.language];
    $("#authTitle").textContent=mode==="signup"?(t.signup||"Create your account"):(t.welcomeBack||"Welcome back");
    $("#authSubtitle").textContent=mode==="signup"?(t.joinNow||"Join as student or teacher."):(t.loginDesc||"Login to manage requests.");
    $("#authSubmitBtn").textContent=mode==="signup"?(t.signup||"Create Account"):(t.loginBtn||"Login");
  }

  async function handleAuthSubmit(e) {
    e.preventDefault(); if(!requireClient()) return;
    const form=new FormData(e.currentTarget);
    const email=form.get("email")?.trim();
    const password=form.get("password");
    try {
      if(State.authMode==="signup") {
        const fullName=form.get("full_name")?.trim()||email.split("@")[0];
        const role=form.get("role")||"student";
        const {data,error}=await State.client.auth.signUp({email,password,options:{data:{full_name:fullName,role}, emailRedirectTo: location.origin + location.pathname}});
        if(error) throw error;
        if(data.user) await State.client.from("profiles").upsert({id:data.user.id,email,full_name:fullName,role,status:role==="teacher"?"pending":"approved",verified:role!=="teacher"});
        toast("Account created. Email confirmation enabled থাকলে inbox check করো।","success");
      } else {
        const {error}=await State.client.auth.signInWithPassword({email,password});
        if(error) throw error;
        toast("Login successful.","success");
      }
      $("#authModal")?.close();
      e.currentTarget.reset();
    } catch(err) { toast(err.message,"error"); }
  }

  async function resetPassword() {
    if(!requireClient()) return;
    const email=$("#authForm [name=email]")?.value?.trim();
    if(!email) return toast("Email লিখুন","error");
    const {error}=await State.client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
    if(error) return toast(error.message,"error");
    toast("Password reset email sent.","success");
  }

  async function logout() {
    if(State.client) await State.client.auth.signOut();
    State.user=null; State.profile=null; State.requests=[];
    updateAuthUI(); routeTo("home"); toast("Logged out.","success");
  }

  async function deleteAccount() {
    if(!requireClient() || !requireUser()) return;
    const confirmed = confirm(i18n[State.language].deleteAccount + "? এই কাজটি অপরিবর্তনীয়!");
    if(!confirmed) return;
    try {
      await State.client.from("profiles").delete().eq("id", State.user.id);
      await State.client.rpc("delete_user", { user_id: State.user.id });
      await State.client.auth.signOut();
      State.user = null; State.profile = null;
      updateAuthUI(); routeTo("home");
      toast("Account deleted successfully.", "success");
    } catch(err) {
      toast("Account deletion failed: " + err.message, "error");
    }
  }

  function fillProfileForm() {
    const form=$("#profileForm"); if(!form) return;
    const p=State.profile||{};
    form.email.value=State.user?.email||"";
    ["full_name","phone","role","district","upazila","fee_monthly","experience_years","qualification","availability","bio"].forEach(k=>{if(form[k]) form[k].value=p[k]??(k==="role"?"student":"")});
    form.subjects.value=Array.isArray(p.subjects)?p.subjects.join(", "):"";
    form.class_levels.value=Array.isArray(p.class_levels)?p.class_levels.join(", "):"";
    $("#approvalHint").textContent=p.role==="teacher"?`Teacher: ${p.status||"pending"}`:"Student profiles active";
  }

  async function saveProfile(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    const form=new FormData(e.currentTarget);
    const role=form.get("role");
    const currentStatus=State.profile?.status;
    const payload={
      id:State.user.id, email:State.user.email, full_name:form.get("full_name")?.trim(),
      phone:form.get("phone")?.trim(), role, district:form.get("district")?.trim(),
      upazila:form.get("upazila")?.trim(), subjects:csvToArray(form.get("subjects")),
      class_levels:csvToArray(form.get("class_levels")), fee_monthly:Number(form.get("fee_monthly")||0),
      experience_years:Number(form.get("experience_years")||0), qualification:form.get("qualification")?.trim(),
      availability:form.get("availability")?.trim(), bio:form.get("bio")?.trim(),
      status:role==="teacher"?(currentStatus==="approved"?"approved":"pending"):"approved",
      verified:role!=="teacher"?true:(State.profile?.verified||false), updated_at:new Date().toISOString()
    };
    const {error}=await State.client.from("profiles").upsert(payload);
    if(error) return toast(error.message,"error");
    State.profile=payload; updateAuthUI();
    toast(role==="teacher"&&payload.status!=="approved"?"Profile saved. Admin approval লাগবে।":"Profile saved.","success");
  }

  async function loadTeacherCount() {
    if(!State.client) return;
    const {count}=await State.client.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher").eq("status","approved");
    if(typeof count==="number") $("#metricTeachers").textContent=toBnNum(`${count}+`);
  }

  // Search History
  function initSearchHistory() {
    renderSearchHistory();
  }
  function saveSearchHistory() {
    const sub = $("#filterSubject")?.value?.trim();
    const dist = $("#filterDistrict")?.value?.trim();
    if(!sub && !dist) return;
    const entry = { subject: sub, district: dist, time: Date.now() };
    State.searchHistory = [entry, ...State.searchHistory.filter(h => !(h.subject===sub && h.district===dist))].slice(0,8);
    localStorage.setItem("tm_search_history", JSON.stringify(State.searchHistory));
    renderSearchHistory();
  }
  function renderSearchHistory() {
    const box = $("#historyChips"); if(!box) return;
    if(!State.searchHistory.length) { box.innerHTML=""; return; }
    box.innerHTML = State.searchHistory.map(h => `<button class="chip" onclick="window.applyHistory('${safeText(h.subject||"")}','${safeText(h.district||"")}')">${safeText(h.subject||h.district||"Search")}</button>`).join("");
  }
  window.applyHistory = (sub, dist) => {
    if($("#filterSubject")) $("#filterSubject").value = sub;
    if($("#filterDistrict")) $("#filterDistrict").value = dist;
    loadTeachers();
  };
  function clearSearchHistory() {
    State.searchHistory = [];
    localStorage.removeItem("tm_search_history");
    renderSearchHistory();
  }

  async function loadTeachers() {
    const grid=$("#teacherGrid"); if(!grid) return;
    grid.innerHTML=`<div class="empty-state">Loading...</div>`;
    if(!requireClient(false)) { grid.innerHTML=`<div class="empty-state">Supabase config বসান</div>`; return; }
    const subject=$("#filterSubject")?.value?.trim().toLowerCase()||"";
    const district=$("#filterDistrict")?.value?.trim()||"";
    const upazila=$("#filterUpazila")?.value?.trim()||"";
    const division=$("#filterDivision")?.value?.trim()||"";
    const classLevel=$("#filterClass")?.value||"";
    let query=State.client.from("profiles").select("id,full_name,email,phone,district,upazila,subjects,class_levels,qualification,experience_years,fee_monthly,bio,availability,rating,total_reviews,verified,status,division").eq("role","teacher").eq("status","approved").order("verified",{ascending:false}).order("rating",{ascending:false});
    if(district) query=query.ilike("district",`%${district}%`);
    if(upazila) query=query.ilike("upazila",`%${upazila}%`);
    if(division) query=query.ilike("division",`%${division}%`);
    const {data,error}=await query;
    if(error) { grid.innerHTML=`<div class="empty-state">${safeText(error.message)}</div>`; return; }
    State.teachers=(data||[]).filter(t=>{
      const subjectMatch=!subject||(t.subjects||[]).some(s=>s.toLowerCase().includes(subject));
      const classMatch=!classLevel||(t.class_levels||[]).some(c=>c.toLowerCase().includes(classLevel.toLowerCase()));
      return subjectMatch&&classMatch;
    });
    renderTeachers();
  }

  function renderTeachers() {
    const grid=$("#teacherGrid");
    if(!State.teachers.length) { grid.innerHTML=`<div class="empty-state"><h3>No verified teachers found</h3></div>`; return; }
    grid.innerHTML=State.teachers.map(t=>{
      const stars = renderStars(t.rating || 0);
      return `<article class="teacher-card"><div class="teacher-card-head"><div class="teacher-avatar">${safeText(initials(t.full_name))}</div><div><h3>${safeText(t.full_name)}</h3><p>${safeText(t.district||"Bangladesh")}${t.upazila?" • "+safeText(t.upazila):""}${t.division?" • "+safeText(t.division):""}</p></div></div>
      <div class="mini-tags">${(t.subjects||[]).slice(0,4).map(s=>`<span>${safeText(s)}</span>`).join("")||"<span>General</span>"}</div>
      <div class="meta-list"><span>🎓 ${safeText(t.qualification||"N/A")}</span><span>⭐ ${stars} ${toBnNum(Number(t.rating||0).toFixed(1))} (${toBnNum(t.total_reviews||0)})</span><span>🕒 ${safeText(t.availability||"Flexible")}</span><span>💰 ${fmtMoney(t.fee_monthly)}/month</span></div>
      <p>${safeText(t.bio||"Verified teacher")}</p><div class="card-actions"><button class="btn btn-primary" data-request-teacher="${t.id}">Request</button><button class="btn btn-secondary" data-view-teacher="${t.id}">Details</button><button class="btn btn-ghost" data-rate-teacher="${t.id}">Rate</button></div></article>`;
    }).join("");
    $$('[data-request-teacher]').forEach(b=>b.addEventListener("click",()=>openRequestModal(b.dataset.requestTeacher)));
    $$('[data-view-teacher]').forEach(b=>b.addEventListener("click",()=>viewTeacher(b.dataset.viewTeacher)));
    $$('[data-rate-teacher]').forEach(b=>b.addEventListener("click",()=>openRatingModal(b.dataset.rateTeacher)));
  }

  function renderStars(rating) {
    let html = '';
    for(let i=1; i<=5; i++) {
      if(i <= Math.round(rating)) html += '★';
      else html += '☆';
    }
    return html;
  }

  function viewTeacher(id) { 
    const t=State.teachers.find(i=>i.id===id); 
    if(!t) return;
    const modal = $("#teacherDetailModal");
    const body = $("#teacherDetailBody");
    const stars = renderStars(t.rating || 0);
    body.innerHTML = `
      <div class="teacher-detail">
        <div class="teacher-detail-head">
          <div class="teacher-avatar large">${safeText(initials(t.full_name))}</div>
          <div>
            <h2>${safeText(t.full_name)}</h2>
            <p>${safeText(t.district||"")}${t.upazila?" • "+safeText(t.upazila):""}${t.division?" • "+safeText(t.division):""}</p>
            <div class="star-display">${stars} ${toBnNum(Number(t.rating||0).toFixed(1))}/5</div>
          </div>
        </div>
        <div class="detail-grid">
          <div><strong>Subjects</strong><p>${(t.subjects||[]).join(", ")||"N/A"}</p></div>
          <div><strong>Classes</strong><p>${(t.class_levels||[]).join(", ")||"N/A"}</p></div>
          <div><strong>Qualification</strong><p>${safeText(t.qualification||"N/A")}</p></div>
          <div><strong>Experience</strong><p>${toBnNum(t.experience_years||0)} years</p></div>
          <div><strong>Fee</strong><p>${fmtMoney(t.fee_monthly)}/month</p></div>
          <div><strong>Availability</strong><p>${safeText(t.availability||"Flexible")}</p></div>
        </div>
        <div class="detail-bio"><strong>Bio</strong><p>${safeText(t.bio||"No bio available.")}</p></div>
        <div class="card-actions"><button class="btn btn-primary" data-request-teacher="${t.id}">Request Teacher</button></div>
      </div>
    `;
    body.querySelector('[data-request-teacher]')?.addEventListener('click', () => { modal.close(); openRequestModal(t.id); });
    modal?.showModal();
  }

  // Rating System
  function initRatingSystem() {
    const container = $("#starRatingInput");
    if(!container) return;
    $$("#starRatingInput button").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.dataset.star);
        $("#ratingValue").value = val;
        $$("#starRatingInput button").forEach((b, idx) => {
          b.style.opacity = idx < val ? "1" : "0.3";
        });
      });
    });
  }

  function openRatingModal(teacherId) {
    if(!requireUser()) return;
    const t = State.teachers.find(i => i.id === teacherId);
    if(!t) return toast("Teacher not found", "error");
    $("#ratingTeacherName").textContent = t.full_name;
    $("#ratingTeacherId").value = teacherId;
    $("#ratingValue").value = 0;
    $$("#starRatingInput button").forEach(b => b.style.opacity = "0.3");
    $("#ratingReview").value = "";
    $("#ratingModal")?.showModal();
  }

  async function submitRating() {
    const teacherId = $("#ratingTeacherId").value;
    const rating = parseInt($("#ratingValue").value);
    const review = $("#ratingReview").value.trim();
    if(!rating) return toast("Please select stars", "error");
    if(!requireClient() || !requireUser()) return;
    
    const {error} = await State.client.from("reviews").insert({
      teacher_id: teacherId,
      student_id: State.user.id,
      rating,
      review,
      created_at: new Date().toISOString()
    });
    if(error) return toast(error.message, "error");
    
    // Recalculate average
    const {data:reviews} = await State.client.from("reviews").select("rating").eq("teacher_id", teacherId);
    const avg = reviews?.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : 0;
    await State.client.from("profiles").update({rating: avg, total_reviews: reviews.length}).eq("id", teacherId);
    
    $("#ratingModal")?.close();
    toast("Rating submitted!", "success");
    loadTeachers();
  }

  function openRequestModal(teacherId) {
    if(!requireUser()) return;
    const teacher=State.teachers.find(i=>i.id===teacherId);
    if(!teacher) return toast("Teacher not found","error");
    const modal=$("#requestModal"); const form=$("#requestForm");
    form.teacher_id.value=teacher.id;
    form.subject.value=teacher.subjects?.[0]||"";
    form.class_level.value=teacher.class_levels?.[0]||"";
    form.bkash_trx_id.value="";
    const t = i18n[State.language];
    $("#requestTeacherName").textContent=`${teacher.full_name} • Fee ${fmtMoney(teacher.fee_monthly)} • Service fee ${fmtMoney(Math.round((teacher.fee_monthly||0)*State.config.studentServiceFeeRate))}. bKash: ${State.config.bkashNumber}`;
    modal?.showModal();
  }

  async function submitTeacherRequest(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    const form=new FormData(e.currentTarget);
    const teacherId=form.get("teacher_id");
    const teacher=State.teachers.find(i=>i.id===teacherId)||{};
    const monthlyFee=Number(teacher.fee_monthly||0);
    const serviceFee=Math.round(monthlyFee*State.config.studentServiceFeeRate);
    const trxId=form.get("bkash_trx_id")?.trim();
    const {data,error}=await State.client.from("tuition_requests").insert({
      student_id:State.user.id, teacher_id:teacherId, subject:form.get("subject")?.trim(),
      class_level:form.get("class_level")?.trim(), schedule_note:form.get("schedule_note")?.trim(),
      monthly_fee:monthlyFee, student_service_fee:serviceFee,
      teacher_commission_rate:State.config.teacherCommissionRate,
      student_service_fee_rate:State.config.studentServiceFeeRate,
      bkash_trx_id:trxId||null, status:trxId?"payment_submitted":"pending_payment"
    }).select("id").single();
    if(error) return toast(error.message,"error");
    if(trxId) await State.client.from("payments").insert({request_id:data.id, payer_id:State.user.id, payment_type:"student_service_fee", method:"bkash", trx_id:trxId, amount:serviceFee, status:"pending"});
    $("#requestModal")?.close(); e.currentTarget.reset(); await loadRequests();
    toast("Request submitted. Admin verify করলে active হবে।","success");
  }

  async function loadDashboard() { 
    if(requireUser()){ 
      fillProfileForm(); 
      await loadRequests(); 
      await loadSchedules(); 
      await loadAttendance(); 
      await loadMaterials(); 
    } 
  }

  async function loadRequests() {
    if(!State.client||!State.user) { State.requests=[]; renderRequests(); return; }
    const {data,error}=await State.client.from("tuition_requests").select(`*, teacher:profiles!tuition_requests_teacher_id_fkey(id,full_name,email,phone,district,subjects,fee_monthly), student:profiles!tuition_requests_student_id_fkey(id,full_name,email,phone,district)`).order("created_at",{ascending:false});
    if(error) State.requests=[]; else State.requests=data||[];
    renderRequests();
  }

  function renderRequests() {
    const list=$("#requestList"); if(!list) return;
    if(!State.user) { list.innerHTML=`<div class="empty-state">Login to see requests</div>`; return; }
    if(!State.requests.length) { list.innerHTML=`<div class="empty-state">No requests yet</div>`; return; }
    list.innerHTML=State.requests.map(r=>{
      const other=State.user.id===r.student_id?r.teacher:r.student;
      const canSubmitPayment=r.student_id===State.user.id && ["pending_payment","rejected"].includes(r.status);
      const teacherCommission=Math.round(Number(r.monthly_fee||0)*Number(r.teacher_commission_rate||0.20));
      return `<article class="request-item"><div><span class="pill ${statusClass(r.status)}">${safeText(r.status)}</span><h3>${safeText(r.subject)} • ${safeText(r.class_level)}</h3><p>With: ${safeText(other?.full_name)} • Fee ${fmtMoney(r.monthly_fee)} • Student fee ${fmtMoney(r.student_service_fee)} • Commission ${fmtMoney(teacherCommission)}</p><small>${fmtDate(r.created_at)} ${r.bkash_trx_id?"• TXN: "+safeText(r.bkash_trx_id):""}</small></div><div class="card-actions">${canSubmitPayment?`<button class="btn btn-secondary" data-pay-request="${r.id}">Submit bKash TXN</button>`:""}<<button class="btn btn-primary" data-open-chat="${r.id}">Chat</button></div></article>`;
    }).join("");
    $$('[data-pay-request]').forEach(b=>b.addEventListener("click",()=>submitPaymentForRequest(b.dataset.payRequest)));
    $$('[data-open-chat]').forEach(b=>b.addEventListener("click",()=>{ routeTo("chat"); setTimeout(()=>openChat(b.dataset.openChat),60); }));
  }

  async function submitPaymentForRequest(requestId) {
    const r=State.requests.find(i=>i.id===requestId); if(!r) return;
    const trxId=prompt(`bKash TXN ID লিখুন। Payment: ${State.config.bkashNumber}`);
    if(!trxId) return;
    const {error}=await State.client.from("tuition_requests").update({bkash_trx_id:trxId.trim(),status:"payment_submitted"}).eq("id",requestId);
    if(error) return toast(error.message,"error");
    await State.client.from("payments").insert({request_id:requestId,payer_id:State.user.id,payment_type:"student_service_fee",method:"bkash",trx_id:trxId.trim(),amount:r.student_service_fee,status:"pending"});
    await loadRequests(); toast("Payment submitted for admin verification.","success");
  }

  function switchPanel(panelId) {
    $$(".side-nav button").forEach(b=>b.classList.toggle("active",b.dataset.panel===panelId));
    $$(".dashboard-panels .panel").forEach(p=>p.classList.toggle("active",p.id===panelId));
  }

  let scheduleFilter = "all";
  function setScheduleFilter(filter) {
    scheduleFilter = filter;
    $("#showAllSchedule").classList.toggle("active", filter==="all");
    $("#showTodaySchedule").classList.toggle("active", filter==="today");
    loadSchedules();
  }

  async function saveSchedule(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    const form=new FormData(e.currentTarget);
    const active=State.requests[0];
    const payload={request_id:active?.id||null, teacher_id:active?.teacher_id||(State.profile?.role==="teacher"?State.user.id:null), student_id:active?.student_id||(State.profile?.role==="student"?State.user.id:null), title:form.get("title")?.trim(), start_at:new Date(form.get("start_at")).toISOString(), end_at:new Date(form.get("end_at")).toISOString(), notes:form.get("notes")?.trim()};
    const {error}=await State.client.from("schedules").insert(payload);
    if(error) return toast(error.message,"error");
    e.currentTarget.reset(); await loadSchedules(); toast("Schedule added.","success");
  }

  async function loadSchedules() {
    const list=$("#scheduleList"); if(!list||!State.client||!State.user) return;
    let query = State.client.from("schedules").select("*").order("start_at",{ascending:true}).limit(20);
    const {data,error}=await query;
    if(error) { list.innerHTML=`<div class="empty-state">${safeText(error.message)}</div>`; return; }
    let items = data||[];
    if(scheduleFilter === "today") {
      const today = new Date().toISOString().slice(0,10);
      items = items.filter(i => i.start_at?.startsWith(today));
    }
    list.innerHTML=items.length?items.map(i=>`<article class="timeline-item ${i.start_at?.startsWith(new Date().toISOString().slice(0,10))?'today':''}"><h3>${safeText(i.title)}</h3><p>${fmtDate(i.start_at)} → ${fmtDate(i.end_at)}</p><small>${safeText(i.notes||"")}</small></article>`).join(""):`<<div class="empty-state">No schedule yet</div>`;
  }

  async function saveAttendance(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    const form=new FormData(e.currentTarget);
    const active=State.requests[0];
    const payload={request_id:active?.id||null, teacher_id:active?.teacher_id||(State.profile?.role==="teacher"?State.user.id:null), student_id:active?.student_id||(State.profile?.role==="student"?State.user.id:null), class_date:form.get("class_date"), status:form.get("status"), notes:form.get("notes")?.trim()};
    const {error}=await State.client.from("attendance").insert(payload);
    if(error) return toast(error.message,"error");
    e.currentTarget.reset(); await loadAttendance(); toast("Attendance saved.","success");
  }

  async function bulkAttendance(status) {
    if(!requireClient() || !requireUser()) return;
    const date = prompt("Enter date (YYYY-MM-DD) for bulk attendance:");
    if(!date) return;
    const active = State.requests[0];
    const payload = {
      request_id: active?.id || null,
      teacher_id: active?.teacher_id || (State.profile?.role==="teacher"?State.user.id:null),
      student_id: active?.student_id || (State.profile?.role==="student"?State.user.id:null),
      class_date: date,
      status,
      notes: "Bulk marked"
    };
    const {error} = await State.client.from("attendance").insert(payload);
    if(error) return toast(error.message, "error");
    await loadAttendance();
    toast(`All marked ${status}`, "success");
  }

  async function loadAttendance() {
    const tbody=$("#attendanceList"); if(!tbody||!State.client||!State.user) return;
    const {data,error}=await State.client.from("attendance").select("*").order("class_date",{ascending:false}).limit(30);
    if(error) tbody.innerHTML=`<tr><td colspan="3">${safeText(error.message)}</td></tr>`;
    else tbody.innerHTML=(data||[]).length?data.map(i=>`<tr><td>${safeText(i.class_date)}</td><td><span class="pill ${i.status==="present"?"success":i.status==="late"?"warning":"danger"}">${safeText(i.status)}</span></td><td>${safeText(i.notes||"")}</td></tr>`).join(""):`<<tr><td colspan="3">No records</td></tr>`;
  }

  async function uploadMaterial(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    const form=new FormData(e.currentTarget);
    const file=form.get("file"); if(!file||!file.name) return toast("File select করুন","error");
    const path=`${State.user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi,"-")}`;
    const upload=await State.client.storage.from("materials").upload(path,file,{upsert:false});
    if(upload.error) return toast(upload.error.message,"error");
    const {data:urlData}=State.client.storage.from("materials").getPublicUrl(path);
    const active=State.requests[0];
    const {error}=await State.client.from("materials").insert({owner_id:State.user.id, request_id:active?.id||null, title:form.get("title")?.trim(), subject:form.get("subject")?.trim(), file_url:urlData.publicUrl, file_path:path, file_type:file.type||"application/octet-stream"});
    if(error) return toast(error.message,"error");
    e.currentTarget.reset(); await loadMaterials(); toast("Material uploaded.","success");
  }

  async function loadMaterials() {
    const list=$("#materialsList"); if(!list||!State.client||!State.user) return;
    const {data,error}=await State.client.from("materials").select("*").order("created_at",{ascending:false}).limit(24);
    if(error) list.innerHTML=`<div class="empty-state">${safeText(error.message)}</div>`;
    else list.innerHTML=(data||[]).length?data.map(i=>{
      const isImage = (i.file_type||"").startsWith("image/");
      return `<article class="material-card"><span class="pill neutral">${safeText(i.subject||"Material")}</span><h3>${safeText(i.title)}</h3><p>${safeText(i.file_type||"File")}</p>${isImage?`<img src="${safeText(i.file_url)}" class="material-thumb" />`:""}<<a class="btn btn-secondary" href="${safeText(i.file_url)}" target="_blank">Open</a></article>`;
    }).join(""):`<<div class="empty-state">No materials</div>`;
  }

  async function loadChatRooms() {
    if(!requireUser()) return;
    await loadRequests();
    const rooms=$("#chatRooms"); if(!rooms) return;
    if(!State.requests.length) { rooms.innerHTML=`<div class="empty-state">No conversations</div>`; return; }
    rooms.innerHTML=State.requests.map(r=>{ const other=State.user.id===r.student_id?r.teacher:r.student; return `<button class="room-item ${State.activeRequestId===r.id?"active":""}" data-chat-room="${r.id}"><strong>${safeText(other?.full_name||r.subject)}</strong><small>${safeText(r.subject)} • ${safeText(r.status)}</small></button>`; }).join("");
    $$('[data-chat-room]').forEach(b=>b.addEventListener("click",()=>openChat(b.dataset.chatRoom)));
    if(!State.activeRequestId && State.requests[0]) openChat(State.requests[0].id);
  }

  async function openChat(requestId) {
    State.activeRequestId=requestId;
    State.activeRequest=State.requests.find(i=>i.id===requestId)||null;
    const other=State.user.id===State.activeRequest?.student_id?State.activeRequest?.teacher:State.activeRequest?.student;
    $("#chatTitle").textContent=other?.full_name||State.activeRequest?.subject||"Conversation";
    $("#chatSubtitle").textContent=`${State.activeRequest?.subject||"Tuition"} • ${State.activeRequest?.status||""}`;
    $$(".room-item").forEach(r=>r.classList.toggle("active",r.dataset.chatRoom===requestId));
    await loadMessages(requestId);
    subscribeToMessages(requestId);
  }

  async function loadMessages(requestId) {
    const box=$("#messagesBox"); if(!box) return;
    box.innerHTML=`<div class="empty-state">Loading...</div>`;
    const {data,error}=await State.client.from("messages").select("*").eq("request_id",requestId).order("created_at",{ascending:true}).limit(100);
    if(error) box.innerHTML=`<div class="empty-state">${safeText(error.message)}</div>`;
    else renderMessages(data||[]);
  }

  function renderMessages(messages) {
    const box=$("#messagesBox");
    if(!messages.length) { box.innerHTML=`<div class="empty-state">No messages yet</div>`; return; }
    box.innerHTML=messages.map(m=>messageHtml(m)).join("");
    box.scrollTop=box.scrollHeight;
  }

  function messageHtml(m) {
    const mine=m.sender_id===State.user?.id;
    let body=m.body;
    if(m.message_type==="image" && m.attachment_url) body=`<img src="${safeText(m.attachment_url)}" class="chat-image-preview" onclick="window.open('${safeText(m.attachment_url)}','_blank')" />`;
    if(m.message_type==="voice" && m.attachment_url) body=`<audio controls src="${safeText(m.attachment_url)}" style="max-width:220px"></audio>`;
    return `<div class="message-bubble ${mine?"mine":""}">${safeText(body)}<<small>${fmtDate(m.created_at)}</small></div>`;
  }

  function subscribeToMessages(requestId) {
    if(!State.client) return;
    if(State.chatChannel) State.client.removeChannel(State.chatChannel);
    State.chatChannel=State.client.channel(`messages:${requestId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`request_id=eq.${requestId}`},payload=>{
      const box=$("#messagesBox");
      if(box?.querySelector(".empty-state")) box.innerHTML="";
      box?.insertAdjacentHTML("beforeend",messageHtml(payload.new));
      if(box) box.scrollTop=box.scrollHeight;
    }).subscribe();
  }

  async function sendMessage(e) {
    e.preventDefault(); if(!requireClient()||!requireUser()) return;
    if(!State.activeRequest) return toast("Select a conversation first","error");
    const input=$("#messageInput"); const body=input.value.trim();
    if(!body) return;
    const receiverId=State.user.id===State.activeRequest.student_id?State.activeRequest.teacher_id:State.activeRequest.student_id;
    const {error}=await State.client.from("messages").insert({request_id:State.activeRequest.id, sender_id:State.user.id, receiver_id:receiverId, body, message_type:"text"});
    if(error) return toast(error.message,"error");
    input.value="";
  }

  // Voice Recorder
  function initVoiceRecorder() {
    const btn = $("#recordVoiceBtn");
    const stopBtn = $("#stopRecordBtn");
    if(!btn) return;
    btn.addEventListener("click", startRecording);
    stopBtn?.addEventListener("click", stopRecording);
  }

  async function startRecording() {
    if(!State.activeRequest) return toast("First select a chat room", "error");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      State.mediaRecorder = new MediaRecorder(stream);
      State.audioChunks = [];
      State.mediaRecorder.ondataavailable = e => { if(e.data.size>0) State.audioChunks.push(e.data); };
      State.mediaRecorder.onstop = uploadVoiceMessage;
      State.mediaRecorder.start();
      $("#voiceRecorder").hidden = false;
      let sec = 0;
      State.recordTimer = setInterval(() => {
        sec++;
        const m = String(Math.floor(sec/60)).padStart(2,'0');
        const s = String(sec%60).padStart(2,'0');
        $("#recordTimer").textContent = `${m}:${s}`;
        if(sec >= 120) stopRecording(); // max 2 min
      }, 1000);
    } catch(err) {
      toast("Microphone access denied", "error");
    }
  }

  function stopRecording() {
    if(State.mediaRecorder && State.mediaRecorder.state !== "inactive") {
      State.mediaRecorder.stop();
      State.mediaRecorder.stream.getTracks().forEach(t=>t.stop());
    }
    clearInterval(State.recordTimer);
    $("#voiceRecorder").hidden = true;
    $("#recordTimer").textContent = "00:00";
  }

  async function uploadVoiceMessage() {
    if(!State.audioChunks.length || !State.activeRequest) return;
    const blob = new Blob(State.audioChunks, {type: 'audio/webm'});
    const path = `chat/${State.activeRequest.id}/${Date.now()}_voice.webm`;
    const upload = await State.client.storage.from("chat_images").upload(path, blob);
    if(upload.error) return toast(upload.error.message, "error");
    const {data:urlData} = State.client.storage.from("chat_images").getPublicUrl(path);
    const receiverId = State.user.id===State.activeRequest.student_id?State.activeRequest.teacher_id:State.activeRequest.student_id;
    const {error} = await State.client.from("messages").insert({
      request_id: State.activeRequest.id, sender_id: State.user.id, receiver_id: receiverId,
      body: "Voice message", message_type: "voice", attachment_url: urlData.publicUrl
    });
    if(error) toast(error.message, "error");
    else toast("Voice sent", "success");
  }

  async function handleImageUpload(e) {
    const file=e.target.files[0]; if(!file) return;
    if(!State.activeRequest) { toast("First select a chat room","error"); return; }
    const receiverId=State.user.id===State.activeRequest.student_id?State.activeRequest.teacher_id:State.activeRequest.student_id;
    const path=`chat/${State.activeRequest.id}/${Date.now()}_${file.name}`;
    const upload=await State.client.storage.from("chat_images").upload(path,file);
    if(upload.error) return toast(upload.error.message,"error");
    const {data:urlData}=State.client.storage.from("chat_images").getPublicUrl(path);
    const {error}=await State.client.from("messages").insert({
      request_id:State.activeRequest.id, sender_id:State.user.id, receiver_id:receiverId,
      body:`<<img src="${urlData.publicUrl}" style="max-width:200px; border-radius:12px;" />`,
      message_type:"image", attachment_url:urlData.publicUrl
    });
    if(error) toast(error.message,"error");
    else toast("Image sent","success");
    $("#imageInput").value="";
  }

  // Admin Dashboard with Tabs
  async function loadAdminDashboard() {
    if(!requireClient()||!requireUser()||!isAdmin()) return toast("Admin access required","error");
    switchAdminTab("pending");
  }

  async function switchAdminTab(tab) {
    const container=$("#adminTabContent"); if(!container) return;
    container.innerHTML=`<div class="empty-state">Loading...</div>`;
    $$("[data-admin-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.adminTab===tab));
    if(tab==="pending") await renderPendingApprovals(container);
    else if(tab==="teachers") await renderAllTeachers(container);
    else if(tab==="students") await renderAllStudents(container);
    else if(tab==="sessions") await renderAllSessions(container);
    else if(tab==="monitor") await renderConversationMonitor(container);
    else if(tab==="revenue") await renderRevenueDashboard(container);
  }

  async function renderPendingApprovals(container) {
    const {data:profiles}=await State.client.from("profiles").select("*").eq("role","teacher").neq("status","approved");
    const {data:payments}=await State.client.from("payments").select("*, tuition_requests(subject)").eq("status","pending");
    container.innerHTML=`<div class="admin-stats"><article><span>Pending Teachers</span><strong>${toBnNum(profiles?.length||0)}</strong></article><article><span>Pending Payments</span><strong>${toBnNum(payments?.length||0)}</strong></article></div>
      <h3>Teachers to Approve</h3><div class="stack-list">${(profiles||[]).map(t=>`<article class="stack-item"><h3>${safeText(t.full_name)}</h3><p>${safeText(t.email)} • ${safeText(t.district)} • ${(t.subjects||[]).join(", ")}</p><div class="card-actions"><button class="btn btn-primary" data-approve="${t.id}">Approve</button><button class="btn btn-danger" data-reject="${t.id}">Reject</button></div></article>`).join("")||"<div class='empty-state'>No pending teachers</div>"}</div>
      <h3>Pending Payments</h3><div class="stack-list">${(payments||[]).map(p=>`<article class="stack-item"><span class="pill warning">${p.payment_type}</span><h3>${fmtMoney(p.amount)}</h3><p>TXN: ${p.trx_id} • Request: ${p.tuition_requests?.subject}</p><div class="card-actions"><button class="btn btn-primary" data-verify-payment="${p.id}" data-request-id="${p.request_id}" data-type="${p.payment_type}">Verify</button><button class="btn btn-danger" data-reject-payment="${p.id}">Reject</button></div></article>`).join("")||"<div class='empty-state'>No pending payments</div>"}</div>`;
    $$("[data-approve]").forEach(b=>b.addEventListener("click",()=>updateTeacherStatus(b.dataset.approve,"approved")));
    $$("[data-reject]").forEach(b=>b.addEventListener("click",()=>updateTeacherStatus(b.dataset.reject,"rejected")));
    $$("[data-verify-payment]").forEach(b=>b.addEventListener("click",()=>verifyPayment(b.dataset.verifyPayment,b.dataset.requestId,b.dataset.type)));
    $$("[data-reject-payment]").forEach(b=>b.addEventListener("click",()=>rejectPayment(b.dataset.rejectPayment)));
  }

  async function renderAllTeachers(container) {
    const {data}=await State.client.from("profiles").select("*").eq("role","teacher").order("created_at",{ascending:false});
    container.innerHTML=`<div class="stack-list">${(data||[]).map(t=>`<article class="stack-item"><h3>${safeText(t.full_name)}</h3><p>${safeText(t.email)} • Status: ${t.status} • ${t.district||""} • ⭐ ${t.rating||0}</p><div class="card-actions"><button class="btn btn-secondary" data-view-profile="${t.id}">View Profile</button></div></article>`).join("")||"<div class='empty-state'>No teachers</div>"}</div>`;
    $$("[data-view-profile]").forEach(b=>b.addEventListener("click",()=>viewTeacher(b.dataset.viewProfile)));
  }

  async function renderAllStudents(container) {
    const {data}=await State.client.from("profiles").select("*").eq("role","student").order("created_at",{ascending:false});
    container.innerHTML=`<div class="stack-list">${(data||[]).map(s=>`<article class="stack-item"><h3>${safeText(s.full_name)}</h3><p>${safeText(s.email)} • Class: ${(s.class_levels||[]).join(",")} • ${s.district||""}</p></article>`).join("")||"<div class='empty-state'>No students</div>"}</div>`;
  }

  async function renderAllSessions(container) {
    const {data}=await State.client.from("tuition_requests").select("*, student:profiles!tuition_requests_student_id_fkey(full_name), teacher:profiles!tuition_requests_teacher_id_fkey(full_name)").order("created_at",{ascending:false});
    container.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Teacher</th><th>Subject</th><th>Status</th><th>Monthly Fee</th><th>TXN</th></tr></thead><tbody>${(data||[]).map(r=>`<tr><td>${safeText(r.student?.full_name)}</td><td>${safeText(r.teacher?.full_name)}</td><td>${safeText(r.subject)}</td><td><span class="pill ${statusClass(r.status)}">${r.status}</span></td><td>${fmtMoney(r.monthly_fee)}</td><td>${safeText(r.bkash_trx_id||"-")}</td></tr>`).join("")||`<tr><td colspan="6">No sessions</td></tr>`}</tbody></table></div>`;
  }

  async function renderConversationMonitor(container) {
    const {data}=await State.client.from("messages").select("*, sender:profiles!sender_id(full_name,role), receiver:profiles!receiver_id(full_name,role), request:tuition_requests(subject)").order("created_at",{ascending:false}).limit(200);
    container.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Date</th><th>From</th><th>To</th><th>Request</th><th>Message</th></tr></thead><tbody>${(data||[]).map(m=>`<tr><td>${fmtDate(m.created_at)}</td><td>${safeText(m.sender?.full_name)} (${m.sender?.role})</td><td>${safeText(m.receiver?.full_name)} (${m.receiver?.role})</td><td>${safeText(m.request?.subject)}</td><td style="max-width:300px">${safeText(m.body).substring(0,100)}</td></tr>`).join("")||`<tr><td colspan="5">No messages</td></tr>`}</tbody></table></div>`;
  }

  async function renderRevenueDashboard(container) {
    const {data:payments}=await State.client.from("payments").select("*").eq("status","verified").order("created_at",{ascending:true});
    const total=payments?.reduce((s,p)=>s+Number(p.amount||0),0)||0;
    const monthly = {};
    payments?.forEach(p => {
      const month = p.created_at?.slice(0,7) || "Unknown";
      monthly[month] = (monthly[month]||0) + Number(p.amount||0);
    });
    
    container.innerHTML=`<div class="admin-stats"><article><span>Total Revenue</span><strong>${fmtMoney(total)}</strong></article><article><span>Verified Payments</span><strong>${toBnNum(payments?.length||0)}</strong></article></div>
    <div class="chart-container"><canvas id="revenueChart" width="800" height="300"></canvas></div>
    <button class="btn btn-secondary" id="exportRevenueBtn">Export CSV</button>`;
    
    drawRevenueChart(monthly);
    $("#exportRevenueBtn")?.addEventListener("click",()=>exportRevenueCsv(payments));
  }

  function drawRevenueChart(monthlyData) {
    const canvas = $("#revenueChart");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const labels = Object.keys(monthlyData);
    const values = Object.values(monthlyData);
    if(!labels.length) return;
    
    const w = canvas.width, h = canvas.height;
    const pad = 40, barW = (w - pad*2) / labels.length - 10;
    const max = Math.max(...values, 1);
    
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#111";
    ctx.font = "12px Inter";
    
    labels.forEach((lab, i) => {
      const val = values[i];
      const barH = (val/max)*(h-pad*2);
      const x = pad + i*(barW+10);
      const y = h - pad - barH;
      
      // Gradient bar
      const grad = ctx.createLinearGradient(0,y,0,h-pad);
      grad.addColorStop(0, "#6d5dfc");
      grad.addColorStop(1, "#9b5cff");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
      
      // Label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#666";
      ctx.fillText(lab, x, h-pad+15);
      ctx.fillText("৳"+toBnNum(Math.round(val)), x, y-5);
    });
  }

  async function updateTeacherStatus(id,status) {
    const {error}=await State.client.from("profiles").update({status, verified:status==="approved"}).eq("id",id);
    if(error) toast(error.message,"error");
    else { toast(`Teacher ${status}`,`success`); await switchAdminTab("pending"); }
  }

  async function verifyPayment(paymentId, requestId, type) {
    const {error}=await State.client.from("payments").update({status:"verified", verified_by:State.user.id, verified_at:new Date().toISOString()}).eq("id",paymentId);
    if(error) return toast(error.message,"error");
    if(type==="student_service_fee") await State.client.from("tuition_requests").update({status:"accepted"}).eq("id",requestId);
    toast("Payment verified","success");
    await switchAdminTab("pending");
  }

  async function rejectPayment(paymentId) {
    const {error}=await State.client.from("payments").update({status:"rejected", verified_by:State.user.id, verified_at:new Date().toISOString()}).eq("id",paymentId);
    if(error) toast(error.message,"error");
    else { toast("Payment rejected","success"); await switchAdminTab("pending"); }
  }

  function exportProfilesCsv() { /* keep existing */ }
  function exportRevenueCsv(payments) {
    if(!payments?.length) return toast("No revenue data","error");
    const headers=["date","amount","type","trx_id"];
    const lines=[headers.join(",")].concat(payments.map(p=>headers.map(h=>csvCell(p[h]||p.created_at)).join(",")));
    const blob=new Blob([lines.join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`revenue-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  function csvCell(v){return `"${String(v??"").replace(/"/g,'""')}"`;}

  // Calendar & Weather
  async function loadTemperature() {
    try{
      const res=await fetch("https://api.openweathermap.org/data/2.5/weather?q=Dhaka&units=metric&appid=276ecb4adfa578bb2b296d44c3d52d17");
      const data=await res.json();
      if(data.main) {
        document.getElementById("temp").innerText=toBnNum(Math.round(data.main.temp));
        document.getElementById("humidity").innerText=toBnNum(data.main.humidity);
        document.getElementById("wind").innerText=toBnNum(Math.round(data.wind?.speed||0));
      }
    }catch(e){ 
      document.getElementById("temp").innerText="--";
      document.getElementById("humidity").innerText="--";
      document.getElementById("wind").innerText="--";
    }
  }

  async function showCalendar() {
    try {
      const res=await fetch("data/bd-holidays.json");
      const holidays=await res.json();
      const today=new Date();
      const bnMonths=["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
      // Approximate Bengali date (simplified)
      const bnDay = today.getDate();
      const bnMonthIdx = (today.getMonth() + 3) % 12; // Approximate offset
      const bnYear = today.getFullYear() - 593; // Approximate
      
      const html=`<div class="calendar-header"><h3>${today.toLocaleDateString("en")}</h3><h4>${bnMonths[bnMonthIdx]} ${toBnNum(bnDay)}, ${toBnNum(bnYear)}</h4></div><h4>Government Holidays ${toBnNum(holidays.year)}</h4><ul class="holiday-list">${holidays.holidays.map(h=>`<li><strong>${h.date}</strong> — ${h.name} <span class="pill neutral">${h.type}</span></li>`).join("")}</ul>`;
      const modal=$("#calendarModal"); $("#calendarContent").innerHTML=html; modal?.showModal();
    } catch(e) {
      toast("Calendar data load failed", "error");
    }
  }

  // Notifications
  function startNotificationPolling() {
    if(State.notificationInterval) clearInterval(State.notificationInterval);
    State.notificationInterval=setInterval(async()=>{
      if(!State.user || !State.client) return;
      const {count:msgCount}=await State.client.from("messages").select("id",{count:"exact",head:true}).eq("receiver_id",State.user.id).eq("read",false);
      const {count:reqCount}=await State.client.from("tuition_requests").select("id",{count:"exact",head:true}).eq("student_id",State.user.id).neq("status","accepted").neq("status","rejected");
      let badge= (msgCount||0)+(reqCount||0);
      if(badge>0) document.title=`(${toBnNum(badge)}) Tuition Master`;
      else document.title="Tuition Master";
    },30000);
  }

  function statusClass(s){ if(["accepted","completed","approved"].includes(s)) return "success"; if(["rejected","cancelled"].includes(s)) return "danger"; return "warning"; }
  function capitalize(s){ return s?s[0].toUpperCase()+s.slice(1):""; }
  function debounce(fn,wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),wait); }; }
  function toast(msg,type="info"){ const zone=$("#toastZone"); if(!zone) return alert(msg); const n=document.createElement("div"); n.className=`toast ${type}`; n.textContent=msg; zone.appendChild(n); setTimeout(()=>n.remove(),4200); }

  const savedTheme=localStorage.getItem("tm_theme")||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  document.documentElement.dataset.theme=savedTheme;
  document.documentElement.lang=State.language==="bn"?"bn":"en";
})();

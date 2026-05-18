(() => {
  "use strict";

  const DEFAULT_CONFIG = {
    appName: "Tuition Master",
    supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
    supabaseAnonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY",
    adminEmails: ["your-admin-email@example.com"],
    bkashNumber: "01XXXXXXXXX",
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
    language: localStorage.getItem("tm_language") || "en"
  };

  // This project owner email is always treated as Admin in the UI.
  const PERMANENT_ADMIN_EMAILS = ["skfuad502@gmail.com"];


  const SUBJECT_OPTIONS = [
    "Bangla", "English", "Math", "General Math", "Higher Math", "Physics", "Chemistry", "Biology",
    "ICT", "Accounting", "Finance", "Business Studies", "Economics", "Civics", "History", "Geography",
    "Islamic Studies", "Science", "Social Science", "Admission Test", "IELTS", "Spoken English", "Arabic", "Quran"
  ];

  const CLASS_LEVEL_OPTIONS = [
    "Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "SSC", "HSC", "Admission", "University", "IELTS"
  ];

  const DISTRICT_AREA_OPTIONS = {
    "Dhaka": ["Mirpur", "Dhanmondi", "Uttara", "Mohammadpur", "Bashundhara", "Gulshan", "Banani", "Badda", "Rampura", "Khilgaon", "Farmgate", "Motijheel", "Wari", "Jatrabari", "Savar", "Keraniganj", "Dohar", "Nawabganj"],
    "Khulna": ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur", "Khan Jahan Ali", "Batiaghata", "Dumuria", "Dacope", "Koyra", "Paikgacha", "Rupsa", "Terokhada", "Phultala", "Dighalia"],
    "Chattogram": ["Agrabad", "GEC", "Nasirabad", "Panchlaish", "Halishahar", "Patenga", "Chawkbazar", "Kotwali", "Sitakunda", "Hathazari", "Raozan", "Patiya", "Boalkhali", "Mirsharai", "Anwara"],
    "Rajshahi": ["Rajshahi Sadar", "Boalia", "Motihar", "Shaheb Bazar", "Rajpara", "Paba", "Godagari", "Tanore", "Durgapur", "Bagha", "Charghat", "Puthia", "Bagmara", "Mohanpur"],
    "Sylhet": ["Sylhet Sadar", "Zindabazar", "Ambarkhana", "Shahjalal Upashahar", "Subid Bazar", "South Surma", "Beanibazar", "Golapganj", "Jaintiapur", "Kanaighat", "Companiganj", "Fenchuganj"],
    "Barishal": ["Barishal Sadar", "Nathullabad", "Rupatali", "Band Road", "Bakerganj", "Babuganj", "Banaripara", "Gournadi", "Agailjhara", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
    "Rangpur": ["Rangpur Sadar", "Medical Mor", "Jahaj Company", "Mithapukur", "Pirgachha", "Badarganj", "Kaunia", "Gangachara", "Taraganj", "Pirganj"],
    "Mymensingh": ["Mymensingh Sadar", "Ganginarpar", "Maskanda", "Trishal", "Bhaluka", "Muktagacha", "Phulpur", "Gafargaon", "Ishwarganj", "Nandail", "Gouripur", "Haluaghat"],
    "Cumilla": ["Cumilla Sadar", "Kandirpar", "Kotbari", "Laksam", "Chauddagram", "Daudkandi", "Debidwar", "Burichang", "Chandina", "Homna", "Meghna", "Monohorgonj"],
    "Jashore": ["Jashore Sadar", "Monihar", "New Market", "Chowgacha", "Jhikargacha", "Keshabpur", "Bagharpara", "Manirampur", "Abhaynagar", "Sharsha"],
    "Gazipur": ["Gazipur Sadar", "Tongi", "Board Bazar", "Konabari", "Kaliakair", "Kapasia", "Kaliganj", "Sreepur"],
    "Narayanganj": ["Narayanganj Sadar", "Chashara", "Siddhirganj", "Fatullah", "Bandar", "Rupganj", "Sonargaon", "Araihazar"],
    "Bogura": ["Bogura Sadar", "Satmatha", "Sherpur", "Shibganj", "Gabtali", "Dhunat", "Sariakandi", "Sonatola", "Kahaloo", "Nandigram"],
    "Dinajpur": ["Dinajpur Sadar", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
    "Kushtia": ["Kushtia Sadar", "Kumarkhali", "Khoksa", "Mirpur", "Daulatpur", "Bheramara"],
    "Faridpur": ["Faridpur Sadar", "Boalmari", "Alfadanga", "Bhanga", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
    "Noakhali": ["Noakhali Sadar", "Maijdee", "Begumganj", "Chatkhil", "Companyganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Chakaria", "Ramu", "Teknaf", "Ukhia", "Maheshkhali", "Kutubdia", "Pekua"],
    "Other": ["Sadar", "Town Area", "University Area", "College Area", "Residential Area", "Online"]
  };

  const DIVISION_DISTRICT_OPTIONS = {
    "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Faridpur"],
    "Khulna": ["Khulna", "Jashore", "Kushtia"],
    "Chattogram": ["Chattogram", "Cumilla", "Noakhali", "Cox's Bazar"],
    "Rajshahi": ["Rajshahi", "Bogura"],
    "Sylhet": ["Sylhet"],
    "Barishal": ["Barishal"],
    "Rangpur": ["Rangpur", "Dinajpur"],
    "Mymensingh": ["Mymensingh"],
    "Online / Other": ["Other"]
  };

  const DIVISION_OPTIONS = Object.keys(DIVISION_DISTRICT_OPTIONS);

  const DISTRICT_OPTIONS = [
    "Dhaka", "Khulna", "Chattogram", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh",
    "Cumilla", "Jashore", "Gazipur", "Narayanganj", "Bogura", "Dinajpur", "Kushtia", "Faridpur", "Noakhali", "Cox's Bazar", "Other"
  ];

  const FEE_OPTIONS = [0, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000];
  const EXPERIENCE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
  const QUALIFICATION_OPTIONS = ["SSC", "HSC", "Diploma", "BSc", "BA", "BBA", "BSS", "BEd", "MSc", "MA", "MBA", "MEd", "MBBS", "Engineering", "University Student", "Other"];
  const AVAILABILITY_OPTIONS = ["Morning", "Afternoon", "Evening", "Night", "Weekdays", "Weekends", "Fri-Sat", "Online", "Home Tuition", "Batch Tuition"];
  const GRADUATION_STATUS_OPTIONS = ["Graduated", "Studying", "Completed", "Running"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const fmtMoney = (value = 0) => `৳${Number(value || 0).toLocaleString("en-BD")}`;
  const fmtDate = (value) => value ? new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const initials = (name = "TM") => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "TM";
  const csvToArray = (value = "") => value.split(",").map(item => item.trim()).filter(Boolean);
  const safeText = (value) => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const configuredAdminEmails = () => [...PERMANENT_ADMIN_EMAILS, ...(State.config.adminEmails || [])]
    .map(item => String(item || "").trim().toLowerCase())
    .filter(Boolean);
  const isAdminEmail = (email) => configuredAdminEmails().includes(String(email || "").trim().toLowerCase());

  function ensureRoleOption(select, value, label, disabled = false) {
    if (!select) return;
    let option = select.querySelector(`option[value="${value}"]`);
    if (!option) {
      option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
    option.disabled = disabled;
  }

  function avatarContent(url, name = "TM") {
    return url ? `<img src="${safeText(url)}" alt="${safeText(name)} profile picture" loading="lazy" />` : `<span>${safeText(initials(name))}</span>`;
  }

  function setAvatar(element, url, name = "TM") {
    if (!element) return;
    element.innerHTML = avatarContent(url, name);
  }

  function parseDateParts(dateValue) {
    if (!dateValue) return { day: "", month: "", year: "" };
    const [year, month, day] = String(dateValue).split("-");
    return { day: day || "", month: month || "", year: year || "" };
  }

  function buildDateFromParts(day, month, year) {
    if (!day || !month || !year) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function populateDobOptions(prefix = "profile", labels = { day: "Day", month: "Month", year: "Year" }) {
    const currentYear = new Date().getFullYear();
    fillSelect($(`#${prefix}DobDay`), Array.from({ length: 31 }, (_, index) => String(index + 1)), labels.day || "Day");
    fillSelect($(`#${prefix}DobMonth`), [
      ["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"],
      ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"]
    ], labels.month || "Month");
    fillSelect($(`#${prefix}DobYear`), Array.from({ length: 80 }, (_, index) => String(currentYear - index)), labels.year || "Year");
  }

  function optionHtml(value, label = value) {
    return `<option value="${safeText(value)}">${safeText(label)}</option>`;
  }

  function fillSelect(select, options, placeholder = "Choose option") {
    if (!select) return;
    const current = select.value;
    select.innerHTML = optionHtml("", placeholder) + options.map(item => Array.isArray(item) ? optionHtml(item[0], item[1]) : optionHtml(item)).join("");
    if (current && [...select.options].some(option => option.value === current)) select.value = current;
  }

  function fillMultiSelect(select, options) {
    if (!select) return;
    const current = getSelectValues(select);
    select.innerHTML = options.map(item => optionHtml(item)).join("");
    setSelectValues(select, current);
  }

  function getSelectValues(select) {
    if (!select) return [];
    if (select.multiple) return [...select.selectedOptions].map(option => option.value).filter(Boolean);
    return select.value ? [select.value] : [];
  }

  function setSelectValues(select, values = []) {
    if (!select) return;
    const normalized = Array.isArray(values) ? values.map(String) : csvToArray(String(values || ""));
    if (select.multiple) {
      [...select.options].forEach(option => option.selected = normalized.includes(option.value));
    } else {
      const first = normalized[0] || "";
      if (first && ![...select.options].some(option => option.value === first)) {
        select.insertAdjacentHTML("beforeend", optionHtml(first));
      }
      select.value = first;
    }
  }

  function getDivisionForDistrict(district) {
    return DIVISION_OPTIONS.find(division => (DIVISION_DISTRICT_OPTIONS[division] || []).includes(district)) || "Online / Other";
  }

  function updateDistrictOptions(selectedValue = "") {
    const divisionSelect = $("#profileDivision");
    const districtSelect = $("#profileDistrict");
    if (!districtSelect) return;
    const division = divisionSelect?.value || "Online / Other";
    const districts = DIVISION_DISTRICT_OPTIONS[division] || DISTRICT_OPTIONS;
    fillSelect(districtSelect, districts, "Choose district");
    if (selectedValue) setSelectValues(districtSelect, [selectedValue]);
    updateUpazilaOptions();
  }

  function updateUpazilaOptions(selectedValue = "") {
    const districtSelect = $("#profileDistrict");
    const upazilaSelect = $("#profileUpazila");
    if (!upazilaSelect) return;
    const district = districtSelect?.value || "Other";
    const areas = DISTRICT_AREA_OPTIONS[district] || DISTRICT_AREA_OPTIONS.Other;
    fillSelect(upazilaSelect, areas, "Choose area / upazila");
    if (selectedValue) setSelectValues(upazilaSelect, [selectedValue]);
  }


  function updateSignupDistrictOptions(selectedValue = "") {
    const divisionSelect = $("#signupDivision");
    const districtSelect = $("#signupDistrict");
    if (!districtSelect) return;
    const division = divisionSelect?.value || "Online / Other";
    const districts = DIVISION_DISTRICT_OPTIONS[division] || DISTRICT_OPTIONS;
    fillSelect(districtSelect, districts, "Select District");
    if (selectedValue) setSelectValues(districtSelect, [selectedValue]);
    updateSignupUpazilaOptions();
  }

  function updateSignupUpazilaOptions(selectedValue = "") {
    const districtSelect = $("#signupDistrict");
    const upazilaSelect = $("#signupUpazila");
    if (!upazilaSelect) return;
    const district = districtSelect?.value || "Other";
    const areas = DISTRICT_AREA_OPTIONS[district] || DISTRICT_AREA_OPTIONS.Other;
    fillSelect(upazilaSelect, areas, "Select Upazila");
    if (selectedValue) setSelectValues(upazilaSelect, [selectedValue]);
  }

  function syncChoiceCards(root = document) {
    $$(".choice-card", root).forEach(card => {
      const input = card.querySelector("input");
      card.classList.toggle("selected", Boolean(input?.checked));
    });
  }

  function updateSignupRoleFields() {
    const role = $("#authForm input[name=role]:checked")?.value || "student";
    $$(".student-only").forEach(el => el.hidden = role !== "student");
    $$(".teacher-only").forEach(el => el.hidden = role !== "teacher");
    syncChoiceCards($("#authForm"));
  }

  function populateOptionFields() {
    fillSelect($("#filterSubject"), SUBJECT_OPTIONS, "Any subject");
    fillSelect($("#filterDistrict"), DISTRICT_OPTIONS, "Any district");
    fillSelect($("#filterClass"), CLASS_LEVEL_OPTIONS, "Any class");
    fillSelect($("#profileDivision"), DIVISION_OPTIONS, "Choose division");
    fillSelect($("#signupDivision"), DIVISION_OPTIONS, "Select / বেছে দিন");
    updateDistrictOptions();
    updateSignupDistrictOptions();
    populateDobOptions("profile", { day: "Day", month: "Month", year: "Year" });
    populateDobOptions("signup", { day: "দিন", month: "মাস", year: "বছর" });
    fillMultiSelect($("#profileSubjects"), SUBJECT_OPTIONS);
    fillMultiSelect($("#profileClassLevels"), CLASS_LEVEL_OPTIONS);
    fillSelect($("#profileFee"), FEE_OPTIONS.map(value => [String(value), value ? `${fmtMoney(value)} / month` : "Negotiable / Not set"]), "Choose monthly fee");
    fillSelect($("#profileExperience"), EXPERIENCE_OPTIONS.map(value => [String(value), value === 0 ? "Fresh / No experience" : `${value}+ years`]), "Choose experience");
    fillSelect($("#profileQualification"), QUALIFICATION_OPTIONS, "Choose qualification");
    fillMultiSelect($("#profileAvailability"), AVAILABILITY_OPTIONS);
    fillSelect($("#profileGraduationStatus"), GRADUATION_STATUS_OPTIONS, "Choose status");
    fillSelect($("#signupStudentClass"), CLASS_LEVEL_OPTIONS, "Class 1");
    fillMultiSelect($("#signupSubjects"), SUBJECT_OPTIONS);
    fillSelect($("#signupFee"), FEE_OPTIONS.map(value => [String(value), value ? `${fmtMoney(value)} / month` : "Negotiable / Not set"]), "e.g. 3000");
    fillMultiSelect($("#signupClassLevels"), CLASS_LEVEL_OPTIONS);
    fillSelect($("#signupExperience"), EXPERIENCE_OPTIONS.map(value => [String(value), value === 0 ? "Less than 1 year / ১ বছরের কম" : `${value}+ years`]), "Less than 1 year");
    fillSelect($("#signupQualification"), QUALIFICATION_OPTIONS, "Choose qualification");
    if ($("#signupBkashNumber")) $("#signupBkashNumber").textContent = State.config.bkashNumber || "01XXXXXXXXX";
    updateSignupRoleFields();
    fillSelect($("#requestSubject"), SUBJECT_OPTIONS, "Choose subject");
    fillSelect($("#requestClassLevel"), CLASS_LEVEL_OPTIONS, "Choose class level");
    fillSelect($("#materialSubject"), SUBJECT_OPTIONS, "Choose subject");
  }

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    await loadConfig();
    initSupabase();
    bindEvents();
    await registerServiceWorker();
    await restoreSession();
    routeTo(location.hash.replace("#", "") || "home");
    await loadTeacherCount();
  }

  async function loadConfig() {
    try {
      const response = await fetch("app-config.json", { cache: "no-store" });
      if (response.ok) {
        State.config = { ...DEFAULT_CONFIG, ...(await response.json()) };
      }
    } catch (_) {
      State.config = DEFAULT_CONFIG;
    }
  }

  function initSupabase() {
    const { supabaseUrl, supabaseAnonKey } = State.config;
    const looksConfigured = supabaseUrl?.startsWith("https://") && !supabaseUrl.includes("YOUR_PROJECT_REF") && !supabaseAnonKey.includes("YOUR_SUPABASE");
    if (!window.supabase || !looksConfigured) {
      console.warn("Supabase is not configured yet. Update app-config.json first.");
      return;
    }
    State.client = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    State.client.auth.onAuthStateChange(async (_event, session) => {
      State.user = session?.user || null;
      await loadUserData();
      updateAuthUI();
    });
  }

  async function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try { await navigator.serviceWorker.register("sw.js"); }
      catch (error) { console.warn("Service worker registration failed", error); }
    }
  }

  function bindEvents() {
    populateOptionFields();
    $("#profileDivision")?.addEventListener("change", () => updateDistrictOptions());
    $("#profileDistrict")?.addEventListener("change", () => updateUpazilaOptions());
    $("#signupDivision")?.addEventListener("change", () => updateSignupDistrictOptions());
    $("#signupDistrict")?.addEventListener("change", () => updateSignupUpazilaOptions());
    $$("#authForm input[type=radio]").forEach(input => input.addEventListener("change", () => { updateSignupRoleFields(); syncChoiceCards($("#authForm")); }));
    $("#profileForm [name=profile_photo]")?.addEventListener("change", previewSelectedProfilePhoto);
    $$('[data-route]').forEach(link => link.addEventListener("click", event => {
      event.preventDefault();
      routeTo(link.dataset.route);
    }));

    window.addEventListener("hashchange", () => routeTo(location.hash.replace("#", "") || "home"));
    $("#menuBtn")?.addEventListener("click", () => $(".main-nav")?.classList.toggle("open"));
    $("#themeToggle")?.addEventListener("click", toggleTheme);
    $("#langToggle")?.addEventListener("click", toggleLanguage);
    $("#openAuthBtn")?.addEventListener("click", () => openAuth("login"));
    $("#heroJoinBtn")?.addEventListener("click", () => openAuth("signup"));
    $("#logoutBtn")?.addEventListener("click", logout);
    $("#authCloseBtn")?.addEventListener("click", () => {
      $("#authModal")?.close();
      if (!State.user && ["dashboard", "chat", "admin"].includes(location.hash.replace("#", ""))) routeTo("home");
    });
    $("#authModal")?.addEventListener("cancel", () => {
      if (!State.user && ["dashboard", "chat", "admin"].includes(location.hash.replace("#", ""))) setTimeout(() => routeTo("home"), 0);
    });
    $("#requestCloseBtn")?.addEventListener("click", () => $("#requestModal")?.close());

    $$("[data-auth-mode]").forEach(button => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
    $("#authForm")?.addEventListener("submit", handleAuthSubmit);
    $("#resetPasswordBtn")?.addEventListener("click", resetPassword);

    $("#searchTeachersBtn")?.addEventListener("click", loadTeachers);
    ["#filterSubject", "#filterDistrict", "#filterClass"].forEach(id => {
      $(id)?.addEventListener("input", debounce(loadTeachers, 350));
      $(id)?.addEventListener("change", loadTeachers);
    });
    $("#requestForm")?.addEventListener("submit", submitTeacherRequest);

    $("#profileForm")?.addEventListener("submit", saveProfile);
    $("#refreshRequestsBtn")?.addEventListener("click", loadRequests);
    $$(".side-nav button").forEach(button => button.addEventListener("click", () => switchPanel(button.dataset.panel)));
    $("#scheduleForm")?.addEventListener("submit", saveSchedule);
    $("#attendanceForm")?.addEventListener("submit", saveAttendance);
    $("#materialForm")?.addEventListener("submit", uploadMaterial);

    $("#messageForm")?.addEventListener("submit", sendMessage);
    $("#loadAdminBtn")?.addEventListener("click", loadAdminDashboard);
    $("#exportCsvBtn")?.addEventListener("click", exportProfilesCsv);
  }

  async function restoreSession() {
    if (!requireClient(false)) {
      updateAuthUI();
      return;
    }
    const { data, error } = await State.client.auth.getSession();
    if (error) toast(error.message, "error");
    State.user = data?.session?.user || null;
    await loadUserData();
    updateAuthUI();
  }

  function requireClient(showMessage = true) {
    if (State.client) return true;
    if (showMessage) toast("Supabase connect হয়নি। app-config.json ফাইলে Project URL এবং Anon Key বসাও।", "error");
    return false;
  }

  function requireUser() {
    if (State.user) return true;
    openAuth("login");
    toast("আগে login করতে হবে।", "error");
    return false;
  }

  function routeTo(route) {
    const validRoute = route || "home";
    const adminBlocked = validRoute === "admin" && !isAdmin();
    const nextRoute = adminBlocked ? "home" : validRoute;
    $$(".page").forEach(page => page.classList.toggle("page-active", page.dataset.page === nextRoute));
    $$(".main-nav a").forEach(link => link.classList.toggle("active", link.dataset.route === nextRoute));
    location.hash = nextRoute;
    $(".main-nav")?.classList.remove("open");

    if (nextRoute === "teachers") loadTeachers();
    if (nextRoute === "dashboard") loadDashboard();
    if (nextRoute === "chat") loadChatRooms();
    if (nextRoute === "admin" && isAdmin()) loadAdminDashboard();
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    localStorage.setItem("tm_theme", next);
    $("#themeToggle").textContent = next === "dark" ? "☀" : "☾";
  }

  function toggleLanguage() {
    State.language = State.language === "en" ? "bn" : "en";
    localStorage.setItem("tm_language", State.language);
    document.documentElement.lang = State.language === "bn" ? "bn" : "en";
    $("#langToggle").textContent = State.language === "bn" ? "English" : "বাংলা";
    toast(State.language === "bn" ? "বাংলা mode চালু হয়েছে।" : "English mode enabled.", "success");
  }

  async function loadUserData() {
    if (!State.user || !State.client) {
      State.profile = null;
      return;
    }

    const { data, error } = await State.client
      .from("profiles")
      .select("*")
      .eq("id", State.user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") toast(error.message, "error");
    State.profile = data || null;

    if (!State.profile) {
      const baseRole = isAdminEmail(State.user.email) ? "admin" : "student";
      const baseProfile = {
        id: State.user.id,
        email: State.user.email,
        full_name: State.user.user_metadata?.full_name || State.user.email?.split("@")[0] || "New User",
        role: baseRole,
        status: baseRole === "teacher" ? "pending" : "approved",
        verified: baseRole !== "teacher",
        updated_at: new Date().toISOString()
      };
      const { error: createError } = await State.client.from("profiles").upsert(baseProfile);
      if (!createError) State.profile = baseProfile;
    }

    // Keep the project owner account permanently approved as admin.
    if (isAdminEmail(State.user.email) && State.profile?.role !== "admin") {
      const adminPatch = { role: "admin", status: "approved", verified: true, updated_at: new Date().toISOString() };
      const { error: adminError } = await State.client.from("profiles").upsert({ ...State.profile, id: State.user.id, email: State.user.email, ...adminPatch });
      if (!adminError) State.profile = { ...State.profile, ...adminPatch };
    }

    await loadRequests();
    await loadSchedules();
    await loadAttendance();
    await loadMaterials();
  }

  function updateAuthUI() {
    const loggedIn = Boolean(State.user);
    if (loggedIn && $("#authModal")?.open) $("#authModal")?.close();
    $("#openAuthBtn").hidden = loggedIn;
    $("#logoutBtn").hidden = !loggedIn;
    $$('[data-admin-link]').forEach(link => { link.hidden = !isAdmin(); });

    const name = State.profile?.full_name || State.user?.email || "Guest";
    $("#profileName").textContent = name;
    const roleLabel = isAdmin() ? "Admin" : capitalize(State.profile?.role || "guest");
    $("#profileRole").textContent = State.profile ? `${roleLabel} • ${State.profile.district || "No district"}` : "Login to manage your profile";
    setAvatar($("#profileAvatar"), State.profile?.avatar_url, name);
    $("#profileStatus").textContent = State.profile?.status || "Not connected";
    $("#profileStatus").className = `pill ${State.profile?.status === "approved" ? "success" : State.profile?.status === "rejected" ? "danger" : "warning"}`;

    fillProfileForm();
  }

  function isAdmin() {
    const email = State.user?.email?.toLowerCase();
    return Boolean(email && (isAdminEmail(email) || State.profile?.role === "admin"));
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    $("#authModal")?.showModal();
  }

  function setAuthMode(mode) {
    State.authMode = mode;
    $$("[data-auth-mode]").forEach(button => button.classList.toggle("active", button.dataset.authMode === mode));
    $("#signupFields").hidden = mode !== "signup";
    $("#loginFields").hidden = mode === "signup";
    const loginEmail = $("#authForm [name=email]");
    const loginPass = $("#authForm [name=password]");
    const signupEmail = $("#authForm [name=email_signup]");
    const signupPass = $("#authForm [name=password_signup]");
    if (loginEmail) loginEmail.required = mode !== "signup";
    if (loginPass) loginPass.required = mode !== "signup";
    if (signupEmail) signupEmail.required = mode === "signup";
    if (signupPass) signupPass.required = mode === "signup";
    updateSignupRoleFields();
    if ($("#signupBkashNumber")) $("#signupBkashNumber").textContent = State.config.bkashNumber || "01XXXXXXXXX";
    $("#authTitle").textContent = mode === "signup" ? "Create your account" : "Welcome back";
    $("#authSubtitle").textContent = mode === "signup" ? "Complete information now; later it can be edited from Profile." : "Login to manage requests, chat, and profile.";
    $("#authSubmitBtn").textContent = mode === "signup" ? "Create Account" : "Login";
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!requireClient()) return;

    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const email = (State.authMode === "signup" ? form.get("email_signup") : form.get("email"))?.trim();
    const password = State.authMode === "signup" ? form.get("password_signup") : form.get("password");

    try {
      if (State.authMode === "signup") {
        const fullName = form.get("full_name")?.trim() || email.split("@")[0];
        const role = isAdminEmail(email) ? "admin" : (form.get("role") || "student");
        const dateOfBirth = buildDateFromParts(form.get("dob_day"), form.get("dob_month"), form.get("dob_year"));
        const subjects = role === "teacher" ? form.getAll("subjects").map(item => String(item).trim()).filter(Boolean) : [];
        const classLevels = role === "teacher" ? form.getAll("class_levels").map(item => String(item).trim()).filter(Boolean) : [form.get("student_class") || "Class 1"];
        const profilePayloadBase = {
          email,
          full_name: fullName,
          phone: form.get("phone")?.trim(),
          role,
          gender: form.get("gender") || null,
          blood_group: form.get("blood_group") || null,
          date_of_birth: dateOfBirth,
          division: form.get("division") || null,
          district: form.get("district") || null,
          upazila: form.get("upazila") || null,
          institution: form.get("institution")?.trim() || null,
          graduation_status: role === "student" ? "Studying" : "Graduated",
          subjects,
          class_levels: classLevels,
          fee_monthly: role === "teacher" ? Number(form.get("fee_monthly") || 0) : 0,
          experience_years: role === "teacher" ? Number(form.get("experience_years") || 0) : 0,
          qualification: role === "teacher" ? (form.get("qualification") || null) : null,
          availability: role === "teacher" ? "Evening, Weekends" : null,
          bio: role === "teacher" ? "Tuition Master verified teacher profile." : "Tuition Master student profile.",
          status: role === "teacher" ? "pending" : "approved",
          verified: role !== "teacher",
          updated_at: new Date().toISOString()
        };
        const { data, error } = await State.client.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } }
        });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await State.client.from("profiles").upsert({ id: data.user.id, ...profilePayloadBase });
          if (profileError) throw profileError;
          if (role === "teacher" && form.get("registration_trx_id")?.trim()) {
            await State.client.from("payments").insert({
              payer_id: data.user.id,
              payment_type: "teacher_registration_fee",
              method: "bkash",
              amount: 0,
              transaction_id: form.get("registration_trx_id")?.trim(),
              status: "pending"
            });
          }
        }
        if (data.session) {
          toast("Account created and logged in.", "success");
        } else {
          toast("Account created. Email confirmation ON থাকলে inbox থেকে confirm করে login করো।", "success");
        }
      } else {
        const { error } = await State.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Login successful.", "success");
      }
      $("#authModal")?.close();
      formEl?.reset();
    } catch (error) {
      toast(error.message || "Authentication failed.", "error");
    }
  }

  async function resetPassword() {
    if (!requireClient()) return;
    const email = $("#authForm [name=email]")?.value?.trim();
    if (!email) return toast("Email লিখে তারপর reset পাঠাও।", "error");
    const { error } = await State.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) return toast(error.message, "error");
    toast("Password reset email sent.", "success");
  }

  async function logout() {
    if (!State.client) return;
    await State.client.auth.signOut();
    State.user = null;
    State.profile = null;
    State.requests = [];
    updateAuthUI();
    routeTo("home");
    toast("Logged out.", "success");
  }

  function fillProfileForm() {
    const form = $("#profileForm");
    if (!form) return;
    const profile = State.profile || {};
    const adminAccount = isAdmin();

    form.email.value = State.user?.email || "";

    if (form.role) {
      if (adminAccount) {
        ensureRoleOption(form.role, "admin", "Admin");
        form.role.value = "admin";
        form.role.disabled = true;
      } else {
        const adminOption = form.role.querySelector('option[value="admin"]');
        if (adminOption) adminOption.remove();
        form.role.disabled = false;
      }
    }

    ["full_name", "phone", "institution", "bio"].forEach(key => {
      if (form[key]) form[key].value = profile[key] ?? "";
    });
    setAvatar($("#profilePhotoPreview"), profile.avatar_url, profile.full_name || State.user?.email || "TM");
    if (form.gender) form.gender.value = profile.gender || "";
    if (form.blood_group) form.blood_group.value = profile.blood_group || "";
    if (form.graduation_status) form.graduation_status.value = profile.graduation_status || "";
    const dob = parseDateParts(profile.date_of_birth || "");
    setSelectValues(form.dob_day, [String(Number(dob.day) || "")]);
    setSelectValues(form.dob_month, [String(Number(dob.month) || "")]);
    setSelectValues(form.dob_year, [dob.year || ""]);
    const division = profile.division || getDivisionForDistrict(profile.district || "");
    setSelectValues(form.division, [division]);
    updateDistrictOptions(profile.district || "");
    updateUpazilaOptions(profile.upazila || "");
    setSelectValues(form.subjects, Array.isArray(profile.subjects) ? profile.subjects : csvToArray(profile.subjects || ""));
    setSelectValues(form.class_levels, Array.isArray(profile.class_levels) ? profile.class_levels : csvToArray(profile.class_levels || ""));
    setSelectValues(form.fee_monthly, [String(profile.fee_monthly ?? "")]);
    setSelectValues(form.experience_years, [String(profile.experience_years ?? "")]);
    setSelectValues(form.qualification, [profile.qualification || ""]);
    setSelectValues(form.availability, csvToArray(profile.availability || ""));
    if (form.role && !adminAccount) form.role.value = profile.role ?? "student";

    if (adminAccount) {
      $("#approvalHint").textContent = "Admin account: approved";
      $("#approvalHint").className = "pill success";
    } else {
      $("#approvalHint").textContent = profile.role === "teacher" ? `Teacher account: ${profile.status || "pending"}` : "Student profiles are active by default";
      $("#approvalHint").className = `pill ${profile.role === "teacher" && profile.status !== "approved" ? "warning" : "success"}`;
    }
  }

  function previewSelectedProfilePhoto(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      event.currentTarget.value = "";
      toast("Only image file upload করা যাবে।", "error");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      event.currentTarget.value = "";
      toast("Profile picture maximum 100 MB হতে পারবে।", "error");
      return;
    }
    const preview = $("#profilePhotoPreview");
    if (preview) preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Selected profile picture preview" />`;
  }

  async function uploadProfilePhoto(file) {
    if (!file || !file.size) return State.profile?.avatar_url || null;
    if (!file.type.startsWith("image/")) throw new Error("Only image file upload করা যাবে।");
    if (file.size > 100 * 1024 * 1024) throw new Error("Profile picture maximum 100 MB হতে পারবে।");

    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${State.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await State.client.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type
    });
    if (error) throw new Error(`${error.message}. Supabase SQL patch run করে avatars bucket create করো।`);
    const { data } = State.client.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl || null;
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    const form = new FormData(event.currentTarget);
    const role = isAdmin() ? "admin" : (form.get("role") || "student");
    const currentStatus = State.profile?.status;
    let avatarUrl = State.profile?.avatar_url || null;
    try {
      avatarUrl = await uploadProfilePhoto(form.get("profile_photo"));
    } catch (error) {
      return toast(error.message || "Profile picture upload failed.", "error");
    }
    const dateOfBirth = buildDateFromParts(form.get("dob_day"), form.get("dob_month"), form.get("dob_year"));
    const payload = {
      id: State.user.id,
      email: State.user.email,
      full_name: form.get("full_name")?.trim(),
      phone: form.get("phone")?.trim(),
      role,
      gender: form.get("gender") || null,
      blood_group: form.get("blood_group") || null,
      institution: form.get("institution")?.trim() || null,
      graduation_status: form.get("graduation_status") || null,
      date_of_birth: dateOfBirth,
      division: form.get("division")?.trim(),
      district: form.get("district")?.trim(),
      upazila: form.get("upazila")?.trim(),
      avatar_url: avatarUrl,
      subjects: form.getAll("subjects").map(item => String(item).trim()).filter(Boolean),
      class_levels: form.getAll("class_levels").map(item => String(item).trim()).filter(Boolean),
      fee_monthly: Number(form.get("fee_monthly") || 0),
      experience_years: Number(form.get("experience_years") || 0),
      qualification: form.get("qualification")?.trim(),
      availability: form.getAll("availability").map(item => String(item).trim()).filter(Boolean).join(", "),
      bio: form.get("bio")?.trim(),
      status: role === "teacher" ? (currentStatus === "approved" ? "approved" : "pending") : "approved",
      verified: role !== "teacher" ? true : State.profile?.verified || false,
      updated_at: new Date().toISOString()
    };

    const { error } = await State.client.from("profiles").upsert(payload);
    if (error) return toast(error.message, "error");
    State.profile = payload;
    if (event.currentTarget.profile_photo) event.currentTarget.profile_photo.value = "";
    updateAuthUI();
    toast(role === "teacher" && payload.status !== "approved" ? "Profile saved. Admin approval লাগবে।" : "Profile saved successfully.", "success");
  }

  async function loadTeacherCount() {
    if (!State.client) return;
    const { count } = await State.client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "teacher")
      .eq("status", "approved");
    if (typeof count === "number") $("#metricTeachers").textContent = `${count}+`;
  }

  async function loadTeachers() {
    const grid = $("#teacherGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state">Loading verified teachers...</div>`;
    if (!requireClient(false)) {
      grid.innerHTML = `<div class="empty-state">Supabase config বসালে teacher list live হবে।</div>`;
      return;
    }

    const subject = $("#filterSubject")?.value?.trim().toLowerCase() || "";
    const district = $("#filterDistrict")?.value?.trim() || "";
    const classLevel = $("#filterClass")?.value || "";

    let query = State.client
      .from("profiles")
      .select("id, full_name, email, phone, district, upazila, subjects, class_levels, qualification, experience_years, fee_monthly, bio, availability, avatar_url, rating, total_reviews, verified, status")
      .eq("role", "teacher")
      .eq("status", "approved")
      .order("verified", { ascending: false })
      .order("rating", { ascending: false });

    if (district) query = query.ilike("district", `%${district}%`);
    const { data, error } = await query;
    if (error) {
      grid.innerHTML = `<div class="empty-state">${safeText(error.message)}</div>`;
      return;
    }

    State.teachers = (data || []).filter(teacher => {
      const subjectMatch = !subject || (teacher.subjects || []).some(item => item.toLowerCase().includes(subject));
      const classMatch = !classLevel || (teacher.class_levels || []).some(item => item.toLowerCase().includes(classLevel.toLowerCase()));
      return subjectMatch && classMatch;
    });

    renderTeachers();
  }

  function renderTeachers() {
    const grid = $("#teacherGrid");
    if (!State.teachers.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No verified teachers found</h3><p>Try another subject or district.</p></div>`;
      return;
    }

    grid.innerHTML = State.teachers.map(teacher => `
      <article class="teacher-card">
        <div class="teacher-card-head">
          <div class="teacher-avatar">${avatarContent(teacher.avatar_url, teacher.full_name || "Teacher")}</div>
          <div>
            <h3>${safeText(teacher.full_name || "Teacher")}</h3>
            <p>${safeText(teacher.district || "Bangladesh")}${teacher.upazila ? " • " + safeText(teacher.upazila) : ""}</p>
          </div>
        </div>
        <div class="mini-tags">${(teacher.subjects || []).slice(0, 4).map(tag => `<span>${safeText(tag)}</span>`).join("") || "<span>General</span>"}</div>
        <div class="meta-list">
          <span>🎓 ${safeText(teacher.qualification || "Qualification not added")}</span>
          <span>⭐ ${Number(teacher.rating || 0).toFixed(1)} (${teacher.total_reviews || 0} reviews)</span>
          <span>🕒 ${safeText(Array.isArray(teacher.availability) ? teacher.availability.join(", ") : (teacher.availability || "Availability flexible"))}</span>
          <span>💰 ${fmtMoney(teacher.fee_monthly)} / month</span>
        </div>
        <p>${safeText(teacher.bio || "Verified Tuition Master teacher ready for student matching.")}</p>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-request-teacher="${teacher.id}">Request Teacher</button>
          <button class="btn btn-secondary" type="button" data-view-teacher="${teacher.id}">View Details</button>
        </div>
      </article>
    `).join("");

    $$('[data-request-teacher]').forEach(button => button.addEventListener("click", () => openRequestModal(button.dataset.requestTeacher)));
    $$('[data-view-teacher]').forEach(button => button.addEventListener("click", () => viewTeacher(button.dataset.viewTeacher)));
  }

  function viewTeacher(id) {
    const teacher = State.teachers.find(item => item.id === id);
    if (!teacher) return;
    toast(`${teacher.full_name}: ${teacher.subjects?.join(", ") || "General"} • ${fmtMoney(teacher.fee_monthly)}/month`, "success");
  }

  function openRequestModal(teacherId) {
    if (!requireUser()) return;
    const teacher = State.teachers.find(item => item.id === teacherId);
    if (!teacher) return toast("Teacher not found.", "error");
    const modal = $("#requestModal");
    const form = $("#requestForm");
    form.teacher_id.value = teacher.id;
    fillSelect(form.subject, teacher.subjects?.length ? teacher.subjects : SUBJECT_OPTIONS, "Choose subject");
    fillSelect(form.class_level, teacher.class_levels?.length ? teacher.class_levels : CLASS_LEVEL_OPTIONS, "Choose class level");
    form.subject.value = teacher.subjects?.[0] || "";
    form.class_level.value = teacher.class_levels?.[0] || "";
    form.bkash_trx_id.value = "";
    $("#requestTeacherName").textContent = `${teacher.full_name} • Fee ${fmtMoney(teacher.fee_monthly)} • Service fee ${fmtMoney(Math.round((teacher.fee_monthly || 0) * State.config.studentServiceFeeRate))}. bKash: ${State.config.bkashNumber}`;
    modal?.showModal();
  }

  async function submitTeacherRequest(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const teacherId = form.get("teacher_id");
    const teacher = State.teachers.find(item => item.id === teacherId) || {};
    const monthlyFee = Number(teacher.fee_monthly || 0);
    const serviceFee = Math.round(monthlyFee * Number(State.config.studentServiceFeeRate || 0.10));
    const trxId = form.get("bkash_trx_id")?.trim();

    const { data, error } = await State.client.from("tuition_requests").insert({
      student_id: State.user.id,
      teacher_id: teacherId,
      subject: form.get("subject")?.trim(),
      class_level: form.get("class_level")?.trim(),
      schedule_note: form.get("schedule_note")?.trim(),
      monthly_fee: monthlyFee,
      student_service_fee: serviceFee,
      teacher_commission_rate: State.config.teacherCommissionRate,
      student_service_fee_rate: State.config.studentServiceFeeRate,
      bkash_trx_id: trxId || null,
      status: trxId ? "payment_submitted" : "pending_payment"
    }).select("id").single();

    if (error) return toast(error.message, "error");

    if (trxId) {
      await State.client.from("payments").insert({
        request_id: data.id,
        payer_id: State.user.id,
        payment_type: "student_service_fee",
        method: "bkash",
        trx_id: trxId,
        amount: serviceFee,
        status: "pending"
      });
    }

    $("#requestModal")?.close();
    formEl?.reset();
    await loadRequests();
    toast("Request submitted. Admin payment verify করলে request active হবে।", "success");
  }

  async function loadDashboard() {
    if (!requireUser()) return;
    fillProfileForm();
    await loadRequests();
    await loadSchedules();
    await loadAttendance();
    await loadMaterials();
  }

  async function loadRequests() {
    if (!State.client || !State.user) {
      State.requests = [];
      renderRequests();
      return;
    }

    const select = `*, teacher:profiles!tuition_requests_teacher_id_fkey(id, full_name, email, phone, district, subjects, fee_monthly), student:profiles!tuition_requests_student_id_fkey(id, full_name, email, phone, district)`;
    let { data, error } = await State.client
      .from("tuition_requests")
      .select(select)
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await State.client.from("tuition_requests").select("*").order("created_at", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn(error);
      State.requests = [];
    } else {
      State.requests = data || [];
    }
    renderRequests();
  }

  function renderRequests() {
    const list = $("#requestList");
    if (!list) return;
    if (!State.user) {
      list.innerHTML = `<div class="empty-state">Login to see your requests.</div>`;
      return;
    }
    if (!State.requests.length) {
      list.innerHTML = `<div class="empty-state">No tuition requests yet.</div>`;
      return;
    }

    list.innerHTML = State.requests.map(request => {
      const other = State.user.id === request.student_id ? request.teacher : request.student;
      const canSubmitPayment = request.student_id === State.user.id && ["pending_payment", "rejected"].includes(request.status);
      const teacherCommission = Math.round(Number(request.monthly_fee || 0) * Number(request.teacher_commission_rate || 0.20));
      return `
        <article class="request-item">
          <div>
            <span class="pill ${statusClass(request.status)}">${safeText(request.status)}</span>
            <h3>${safeText(request.subject || "Tuition Request")} • ${safeText(request.class_level || "Class")}</h3>
            <p>With: ${safeText(other?.full_name || "User")} • Fee ${fmtMoney(request.monthly_fee)} • Student service fee ${fmtMoney(request.student_service_fee)} • Teacher commission ${fmtMoney(teacherCommission)}</p>
            <small>Created: ${fmtDate(request.created_at)} ${request.bkash_trx_id ? "• TXN: " + safeText(request.bkash_trx_id) : ""}</small>
          </div>
          <div class="card-actions">
            ${canSubmitPayment ? `<button class="btn btn-secondary" type="button" data-pay-request="${request.id}">Submit bKash TXN</button>` : ""}
            <button class="btn btn-primary" type="button" data-open-chat="${request.id}">Chat</button>
          </div>
        </article>
      `;
    }).join("");

    $$('[data-pay-request]').forEach(button => button.addEventListener("click", () => submitPaymentForRequest(button.dataset.payRequest)));
    $$('[data-open-chat]').forEach(button => button.addEventListener("click", () => { routeTo("chat"); setTimeout(() => openChat(button.dataset.openChat), 60); }));
  }

  async function submitPaymentForRequest(requestId) {
    const request = State.requests.find(item => item.id === requestId);
    if (!request) return;
    const trxId = prompt(`bKash Transaction ID লিখো। Payment number: ${State.config.bkashNumber}`);
    if (!trxId) return;
    const { error } = await State.client.from("tuition_requests").update({ bkash_trx_id: trxId.trim(), status: "payment_submitted" }).eq("id", requestId);
    if (error) return toast(error.message, "error");
    await State.client.from("payments").insert({
      request_id: requestId,
      payer_id: State.user.id,
      payment_type: "student_service_fee",
      method: "bkash",
      trx_id: trxId.trim(),
      amount: request.student_service_fee,
      status: "pending"
    });
    await loadRequests();
    toast("Payment submitted for admin verification.", "success");
  }

  function switchPanel(panelId) {
    $$(".side-nav button").forEach(button => button.classList.toggle("active", button.dataset.panel === panelId));
    $$(".dashboard-panels .panel").forEach(panel => panel.classList.toggle("active", panel.id === panelId));
  }

  async function saveSchedule(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const active = State.requests[0];
    const payload = {
      request_id: active?.id || null,
      teacher_id: active?.teacher_id || (State.profile?.role === "teacher" ? State.user.id : null),
      student_id: active?.student_id || (State.profile?.role === "student" ? State.user.id : null),
      title: form.get("title")?.trim(),
      start_at: new Date(form.get("start_at")).toISOString(),
      end_at: new Date(form.get("end_at")).toISOString(),
      notes: form.get("notes")?.trim()
    };
    const { error } = await State.client.from("schedules").insert(payload);
    if (error) return toast(error.message, "error");
    formEl?.reset();
    await loadSchedules();
    toast("Schedule added.", "success");
  }

  async function loadSchedules() {
    const list = $("#scheduleList");
    if (!list || !State.client || !State.user) return;
    const { data, error } = await State.client.from("schedules").select("*").order("start_at", { ascending: true }).limit(20);
    if (error) {
      list.innerHTML = `<div class="empty-state">${safeText(error.message)}</div>`;
      return;
    }
    list.innerHTML = (data || []).length ? data.map(item => `
      <article class="timeline-item">
        <h3>${safeText(item.title)}</h3>
        <p>${fmtDate(item.start_at)} → ${fmtDate(item.end_at)}</p>
        <small>${safeText(item.notes || "")}</small>
      </article>
    `).join("") : `<div class="empty-state">No schedule yet.</div>`;
  }

  async function saveAttendance(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const active = State.requests[0];
    const payload = {
      request_id: active?.id || null,
      teacher_id: active?.teacher_id || (State.profile?.role === "teacher" ? State.user.id : null),
      student_id: active?.student_id || (State.profile?.role === "student" ? State.user.id : null),
      class_date: form.get("class_date"),
      status: form.get("status"),
      notes: form.get("notes")?.trim()
    };
    const { error } = await State.client.from("attendance").insert(payload);
    if (error) return toast(error.message, "error");
    formEl?.reset();
    await loadAttendance();
    toast("Attendance saved.", "success");
  }

  async function loadAttendance() {
    const tbody = $("#attendanceList");
    if (!tbody || !State.client || !State.user) return;
    const { data, error } = await State.client.from("attendance").select("*").order("class_date", { ascending: false }).limit(30);
    if (error) {
      tbody.innerHTML = `<tr><td colspan="3">${safeText(error.message)}</td></tr>`;
      return;
    }
    tbody.innerHTML = (data || []).length ? data.map(item => `
      <tr><td>${safeText(item.class_date)}</td><td><span class="pill ${item.status === "present" ? "success" : item.status === "late" ? "warning" : "danger"}">${safeText(item.status)}</span></td><td>${safeText(item.notes || "")}</td></tr>
    `).join("") : `<tr><td colspan="3">No attendance records.</td></tr>`;
  }

  async function uploadMaterial(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const file = form.get("file");
    if (!file || !file.name) return toast("Upload করার জন্য file select করো।", "error");

    const path = `${State.user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "-")}`;
    const upload = await State.client.storage.from("materials").upload(path, file, { upsert: false });
    if (upload.error) return toast(upload.error.message, "error");
    const { data: urlData } = State.client.storage.from("materials").getPublicUrl(path);
    const active = State.requests[0];
    const { error } = await State.client.from("materials").insert({
      owner_id: State.user.id,
      request_id: active?.id || null,
      title: form.get("title")?.trim(),
      subject: form.get("subject")?.trim(),
      file_url: urlData.publicUrl,
      file_path: path,
      file_type: file.type || "application/octet-stream"
    });
    if (error) return toast(error.message, "error");
    formEl?.reset();
    await loadMaterials();
    toast("Material uploaded.", "success");
  }

  async function loadMaterials() {
    const list = $("#materialsList");
    if (!list || !State.client || !State.user) return;
    const { data, error } = await State.client.from("materials").select("*").order("created_at", { ascending: false }).limit(24);
    if (error) {
      list.innerHTML = `<div class="empty-state">${safeText(error.message)}</div>`;
      return;
    }
    list.innerHTML = (data || []).length ? data.map(item => `
      <article class="material-card">
        <span class="pill neutral">${safeText(item.subject || "Material")}</span>
        <h3>${safeText(item.title)}</h3>
        <p>${safeText(item.file_type || "File")}</p>
        <a class="btn btn-secondary" href="${safeText(item.file_url)}" target="_blank" rel="noopener">Open File</a>
      </article>
    `).join("") : `<div class="empty-state">No materials uploaded.</div>`;
  }

  async function loadChatRooms() {
    if (!requireUser()) return;
    await loadRequests();
    const rooms = $("#chatRooms");
    if (!rooms) return;
    if (!State.requests.length) {
      rooms.innerHTML = `<div class="empty-state">No request conversations yet.</div>`;
      return;
    }
    rooms.innerHTML = State.requests.map(request => {
      const other = State.user.id === request.student_id ? request.teacher : request.student;
      return `<button class="room-item ${State.activeRequestId === request.id ? "active" : ""}" type="button" data-chat-room="${request.id}"><strong>${safeText(other?.full_name || request.subject || "Conversation")}</strong><small>${safeText(request.subject || "Tuition")} • ${safeText(request.status)}</small></button>`;
    }).join("");
    $$('[data-chat-room]').forEach(button => button.addEventListener("click", () => openChat(button.dataset.chatRoom)));
    if (!State.activeRequestId && State.requests[0]) openChat(State.requests[0].id);
  }

  async function openChat(requestId) {
    State.activeRequestId = requestId;
    State.activeRequest = State.requests.find(item => item.id === requestId) || null;
    const other = State.user.id === State.activeRequest?.student_id ? State.activeRequest?.teacher : State.activeRequest?.student;
    $("#chatTitle").textContent = other?.full_name || State.activeRequest?.subject || "Conversation";
    $("#chatSubtitle").textContent = `${State.activeRequest?.subject || "Tuition"} • ${State.activeRequest?.status || ""}`;
    $$(".room-item").forEach(room => room.classList.toggle("active", room.dataset.chatRoom === requestId));
    await loadMessages(requestId);
    subscribeToMessages(requestId);
  }

  async function loadMessages(requestId) {
    const box = $("#messagesBox");
    if (!box) return;
    box.innerHTML = `<div class="empty-state">Loading messages...</div>`;
    const { data, error } = await State.client
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) {
      box.innerHTML = `<div class="empty-state">${safeText(error.message)}</div>`;
      return;
    }
    renderMessages(data || []);
  }

  function renderMessages(messages) {
    const box = $("#messagesBox");
    if (!messages.length) {
      box.innerHTML = `<div class="empty-state">No messages yet. Start the conversation.</div>`;
      return;
    }
    box.innerHTML = messages.map(message => messageHtml(message)).join("");
    box.scrollTop = box.scrollHeight;
  }

  function messageHtml(message) {
    const mine = message.sender_id === State.user?.id;
    return `<div class="message-bubble ${mine ? "mine" : ""}">${safeText(message.body)}<small>${fmtDate(message.created_at)}</small></div>`;
  }

  function subscribeToMessages(requestId) {
    if (!State.client) return;
    if (State.chatChannel) State.client.removeChannel(State.chatChannel);
    State.chatChannel = State.client
      .channel(`messages:${requestId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` }, payload => {
        const box = $("#messagesBox");
        if (box?.querySelector(".empty-state")) box.innerHTML = "";
        box?.insertAdjacentHTML("beforeend", messageHtml(payload.new));
        if (box) box.scrollTop = box.scrollHeight;
      })
      .subscribe();
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!requireClient() || !requireUser()) return;
    if (!State.activeRequest) return toast("Select a conversation first.", "error");
    const input = $("#messageInput");
    const body = input.value.trim();
    if (!body) return;
    const receiverId = State.user.id === State.activeRequest.student_id ? State.activeRequest.teacher_id : State.activeRequest.student_id;
    const { error } = await State.client.from("messages").insert({
      request_id: State.activeRequest.id,
      sender_id: State.user.id,
      receiver_id: receiverId,
      body,
      message_type: "text"
    });
    if (error) return toast(error.message, "error");
    input.value = "";
  }

  async function loadAdminDashboard() {
    if (!requireClient() || !requireUser() || !isAdmin()) return toast("Admin access required.", "error");
    const [profilesResult, paymentsResult, requestsResult] = await Promise.all([
      State.client.from("profiles").select("*").order("created_at", { ascending: false }),
      State.client.from("payments").select("*, tuition_requests(subject, class_level, monthly_fee)").order("created_at", { ascending: false }),
      State.client.from("tuition_requests").select("*")
    ]);

    if (profilesResult.error) return toast(profilesResult.error.message, "error");
    if (paymentsResult.error) return toast(paymentsResult.error.message, "error");

    const profiles = profilesResult.data || [];
    const payments = paymentsResult.data || [];
    const pendingTeachers = profiles.filter(profile => profile.role === "teacher" && profile.status !== "approved");
    const pendingPayments = payments.filter(payment => payment.status === "pending");
    const revenue = payments.filter(payment => payment.status === "verified").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    $("#adminUsersCount").textContent = profiles.length;
    $("#adminPendingCount").textContent = pendingTeachers.length;
    $("#adminPaymentsCount").textContent = pendingPayments.length;
    $("#adminRevenue").textContent = fmtMoney(revenue);

    renderAdminTeachers(pendingTeachers);
    renderAdminPayments(pendingPayments);
    window.__tmProfilesForExport = profiles;
  }

  function renderAdminTeachers(teachers) {
    const list = $("#adminTeacherList");
    if (!teachers.length) {
      list.innerHTML = `<div class="empty-state">No pending teachers.</div>`;
      return;
    }
    list.innerHTML = teachers.map(teacher => `
      <article class="stack-item">
        <h3>${safeText(teacher.full_name || "Teacher")}</h3>
        <p>${safeText(teacher.email)} • ${safeText(teacher.district || "No district")} • ${safeText((teacher.subjects || []).join(", "))}</p>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-approve-teacher="${teacher.id}">Approve</button>
          <button class="btn btn-danger" type="button" data-reject-teacher="${teacher.id}">Reject</button>
        </div>
      </article>
    `).join("");
    $$('[data-approve-teacher]').forEach(button => button.addEventListener("click", () => updateTeacherStatus(button.dataset.approveTeacher, "approved")));
    $$('[data-reject-teacher]').forEach(button => button.addEventListener("click", () => updateTeacherStatus(button.dataset.rejectTeacher, "rejected")));
  }

  async function updateTeacherStatus(id, status) {
    const { error } = await State.client.from("profiles").update({ status, verified: status === "approved" }).eq("id", id);
    if (error) return toast(error.message, "error");
    toast(`Teacher ${status}.`, "success");
    await loadAdminDashboard();
  }

  function renderAdminPayments(payments) {
    const list = $("#adminPaymentList");
    if (!payments.length) {
      list.innerHTML = `<div class="empty-state">No pending payments.</div>`;
      return;
    }
    list.innerHTML = payments.map(payment => `
      <article class="stack-item">
        <span class="pill warning">${safeText(payment.payment_type)}</span>
        <h3>${fmtMoney(payment.amount)} • ${safeText(payment.method || "bkash")}</h3>
        <p>TXN: ${safeText(payment.trx_id || "N/A")} • Request: ${safeText(payment.tuition_requests?.subject || "Tuition")}</p>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-verify-payment="${payment.id}" data-request-id="${payment.request_id}" data-payment-type="${payment.payment_type}">Verify</button>
          <button class="btn btn-danger" type="button" data-reject-payment="${payment.id}">Reject</button>
        </div>
      </article>
    `).join("");
    $$('[data-verify-payment]').forEach(button => button.addEventListener("click", () => verifyPayment(button.dataset.verifyPayment, button.dataset.requestId, button.dataset.paymentType)));
    $$('[data-reject-payment]').forEach(button => button.addEventListener("click", () => rejectPayment(button.dataset.rejectPayment)));
  }

  async function verifyPayment(paymentId, requestId, type) {
    const { error } = await State.client.from("payments").update({ status: "verified", verified_by: State.user.id, verified_at: new Date().toISOString() }).eq("id", paymentId);
    if (error) return toast(error.message, "error");
    if (type === "student_service_fee") {
      await State.client.from("tuition_requests").update({ status: "accepted" }).eq("id", requestId);
    }
    toast("Payment verified.", "success");
    await loadAdminDashboard();
  }

  async function rejectPayment(paymentId) {
    const { error } = await State.client.from("payments").update({ status: "rejected", verified_by: State.user.id, verified_at: new Date().toISOString() }).eq("id", paymentId);
    if (error) return toast(error.message, "error");
    toast("Payment rejected.", "success");
    await loadAdminDashboard();
  }

  function exportProfilesCsv() {
    const profiles = window.__tmProfilesForExport || [];
    if (!profiles.length) return toast("No profiles to export.", "error");
    const headers = ["full_name", "email", "phone", "role", "district", "upazila", "subjects", "status", "fee_monthly", "created_at"];
    const lines = [headers.join(",")].concat(profiles.map(profile => headers.map(key => csvCell(Array.isArray(profile[key]) ? profile[key].join(" | ") : profile[key])).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tuition-master-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value = "") {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function statusClass(status = "") {
    if (["accepted", "completed", "approved"].includes(status)) return "success";
    if (["rejected", "cancelled"].includes(status)) return "danger";
    return "warning";
  }

  function capitalize(value = "") {
    return value ? value[0].toUpperCase() + value.slice(1) : "";
  }

  function debounce(fn, wait = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  function toast(message, type = "info") {
    const zone = $("#toastZone");
    if (!zone) return alert(message);
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.textContent = message;
    zone.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  const savedTheme = localStorage.getItem("tm_theme") || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = savedTheme;
  document.documentElement.lang = State.language === "bn" ? "bn" : "en";
})();

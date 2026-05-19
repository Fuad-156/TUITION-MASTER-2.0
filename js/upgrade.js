
(() => {
  const loader = document.createElement('div');
  loader.className = 'startup-loader';
  loader.innerHTML = `
    <div class="loader-card">
      <div class="loader-logo">TM</div>
      <h2>Launching Tuition Master 3.0</h2>
      <p>Loading theme, Supabase session, weather, notifications, Bangla calendar, and realtime experience...</p>
      <div class="loader-bar"><span></span></div>
    </div>`;
  document.body.prepend(loader);

  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 2200);
  });

  const utilityBar = document.createElement('section');
  utilityBar.className = 'utility-bar';
  utilityBar.innerHTML = `
    <div class="utility-group">
      <div class="utility-pill"><span>🕒</span><strong id="liveClock">--:--:--</strong></div>
      <div class="utility-pill calendar-card">
        <span id="gregorianDate">Loading date...</span>
        <small id="banglaDate">বাংলা তারিখ লোড হচ্ছে...</small>
      </div>
    </div>
    <div class="utility-group">
      <div class="utility-pill weather-card" id="weatherWidget">🌤️ Detecting weather...</div>
      <button class="utility-pill notification-btn" id="notificationToggle">🔔 Notifications <span class="notification-count" id="notificationCount">0</span></button>
      <button class="utility-pill install-btn" id="installBtn" hidden>📲 Install App</button>
    </div>`;

  document.querySelector('.app-shell')?.prepend(utilityBar);

  const panel = document.createElement('aside');
  panel.className = 'notification-panel';
  panel.id = 'notificationPanel';
  document.body.append(panel);

  const notifications = JSON.parse(localStorage.getItem('tm_notifications') || '[]');

  function renderNotifications(){
    const count = document.getElementById('notificationCount');
    count.textContent = notifications.length;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3>Notifications</h3>
        <button class="utility-pill" id="markReadBtn">Mark all as read</button>
      </div>
      ${notifications.length ? notifications.map(item => `<div class="notification-item"><strong>${item.title}</strong><p>${item.message}</p><small>${item.time}</small></div>`).join('') : '<div class="notification-item">No new notifications</div>'}`;

    document.getElementById('markReadBtn')?.addEventListener('click', () => {
      notifications.length = 0;
      localStorage.setItem('tm_notifications', JSON.stringify(notifications));
      renderNotifications();
    });
  }

  if (!notifications.length) {
    notifications.push(
      { title: 'Welcome to Tuition Master', message: 'Your AI powered tuition platform is ready.', time: new Date().toLocaleString('en-BD') },
      { title: 'Realtime Messaging Enabled', message: 'Students and teachers can now exchange voice notes.', time: new Date().toLocaleString('en-BD') },
      { title: 'Admin Dashboard Ready', message: 'Revenue charts and CSV export are available.', time: new Date().toLocaleString('en-BD') }
    );
    localStorage.setItem('tm_notifications', JSON.stringify(notifications));
  }

  renderNotifications();

  document.getElementById('notificationToggle')?.addEventListener('click', () => {
    panel.classList.toggle('active');
  });

  function updateClock(){
    const now = new Date();
    const clock = document.getElementById('liveClock');
    const gregorian = document.getElementById('gregorianDate');
    const bangla = document.getElementById('banglaDate');
    if (clock) clock.textContent = now.toLocaleTimeString('en-BD');
    if (gregorian) gregorian.textContent = now.toLocaleDateString('en-BD', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    if (bangla) bangla.textContent = now.toLocaleDateString('bn-BD-u-ca-beng', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  updateClock();
  setInterval(updateClock,1000);

  async function loadWeather(){
    const widget = document.getElementById('weatherWidget');
    if (!navigator.geolocation || !widget) {
      widget.textContent = '🌤️ Weather unavailable';
      return;
    }
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`);
        const data = await response.json();
        const current = data.current || {};
        widget.innerHTML = `🌤️ ${Math.round(current.temperature_2m || 0)}°C • 💧 ${current.relative_humidity_2m || 0}% • 🌬️ ${current.wind_speed_10m || 0} km/h`;
      } catch (error) {
        widget.textContent = '🌤️ Weather API unavailable';
      }
    });
  }
  loadWeather();

  const hero = document.querySelector('.hero-page');
  if (hero) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const particles = Array.from({length:90}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + .8,
      dx: (Math.random() - .5) * .6,
      dy: (Math.random() - .5) * .6
    }));

    function resize(){
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function draw(){
      resize();
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', resize);
  }

  const teacherMetrics = document.getElementById('metricTeachers');
  if (teacherMetrics) teacherMetrics.textContent = '100+';
  const metricRow = document.querySelector('.metric-row');
  if (metricRow && !metricRow.dataset.upgraded) {
    metricRow.dataset.upgraded = 'true';
    metricRow.innerHTML = `
      <div><strong>100+</strong><span>Teachers</span></div>
      <div><strong>64</strong><span>Districts</span></div>
      <div><strong>500+</strong><span>Students</span></div>`;
  }

  const searchBtn = document.getElementById('searchTeachersBtn');
  const teachersPage = document.getElementById('teachersPage');
  const historyWrap = document.createElement('div');
  historyWrap.className = 'search-history';
  teachersPage?.querySelector('.filter-panel')?.after(historyWrap);

  function renderSearchHistory(){
    const history = JSON.parse(localStorage.getItem('tm_search_history') || '[]');
    historyWrap.innerHTML = history.length ? history.map(item => `<button class="history-chip">${item}</button>`).join('') : '<small>No recent searches</small>';
  }
  renderSearchHistory();

  searchBtn?.addEventListener('click', () => {
    const subject = document.getElementById('filterSubject')?.value || 'All Subjects';
    const district = document.getElementById('filterDistrict')?.value || 'Bangladesh';
    const label = `${subject} • ${district}`;
    const history = JSON.parse(localStorage.getItem('tm_search_history') || '[]');
    history.unshift(label);
    localStorage.setItem('tm_search_history', JSON.stringify([...new Set(history)].slice(0,6)));
    renderSearchHistory();
  });

  const authTeacherSection = document.querySelector('.teacher-only.signup-note-card');
  if (authTeacherSection && !document.querySelector('.teacher-payment-box')) {
    const box = document.createElement('div');
    box.className = 'teacher-payment-box';
    box.innerHTML = `
      <h4>💳 Teacher Verification Payment</h4>
      <p>Teachers need to pay <strong>৳200</strong> via bKash before final approval.</p>
      <label>bKash Transaction ID<input type="text" placeholder="TXN123456" name="teacher_bkash_txn" /></label>`;
    authTeacherSection.append(box);
  }

  const requestModal = document.getElementById('requestModal');
  if (requestModal && !requestModal.querySelector('.service-fee-note')) {
    const note = document.createElement('div');
    note.className = 'teacher-payment-box service-fee-note';
    note.innerHTML = '<strong>Student Service Fee:</strong> 10% platform fee will be verified by the admin panel after payment.';
    requestModal.querySelector('form')?.insertBefore(note, requestModal.querySelector('button[type="submit"]'));
  }

  const adminPage = document.getElementById('adminPage');
  if (adminPage && !adminPage.querySelector('.chart-card')) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `
      <h3>📈 Monthly Revenue Overview</h3>
      <p>Realtime tuition platform earnings.</p>
      <div class="chart-bars">
        <span style="height:32%"></span>
        <span style="height:44%"></span>
        <span style="height:58%"></span>
        <span style="height:76%"></span>
        <span style="height:84%"></span>
        <span style="height:96%"></span>
      </div>`;
    adminPage.prepend(card);
  }

  const chatPage = document.getElementById('chatPage');
  if (chatPage && !chatPage.querySelector('.voice-note-btn')) {
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'voice-note-btn';
    voiceBtn.textContent = '🎙️ Record Voice Note';
    voiceBtn.addEventListener('click', async () => {
      if (!navigator.mediaDevices) {
        alert('Voice recording is not supported on this device.');
        return;
      }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        notifications.unshift({ title: 'Voice Note Ready', message: 'Microphone permission granted for realtime messaging.', time: new Date().toLocaleString('en-BD') });
        localStorage.setItem('tm_notifications', JSON.stringify(notifications));
        renderNotifications();
        alert('Microphone connected. You can extend this with Supabase storage uploads.');
      } catch (error) {
        alert('Microphone access denied.');
      }
    });
    chatPage.prepend(voiceBtn);
  }

  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  bottomNav.innerHTML = `
    <a href="#home"><span>🏠</span><small>Home</small></a>
    <a href="#teachers"><span>🔎</span><small>Search</small></a>
    <a href="#chat"><span>💬</span><small>Messages</small></a>
    <a href="#dashboard"><span>👤</span><small>Profile</small></a>`;
  document.body.append(bottomNav);

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.hidden = false;
  });

  document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installBtn').hidden = true;
  });
})();

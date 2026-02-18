// License check – frontend op http://localhost:5050, backend op http://localhost:3000
// Backend kan in development (NODE_ENV=development) een fake licentie teruggeven

console.log('[main.js] Geladen');

const BACKEND_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://ajdaacuzcqhuzfmaibpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZGFhY3V6Y3FodXpmbWFpYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTY5MjgsImV4cCI6MjA4NTQzMjkyOH0.YHc_DmcS7nAydAjecaTwmoIEV-8am1S_qpdeuIsuSTw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginStatusEl = document.getElementById('loginStatus');
const loginEmailEl = document.getElementById('loginEmail');
const licenseStatusEl = document.getElementById('licenseStatus');
const licensePlanEl = document.getElementById('licensePlan');
const licenseValidUntilEl = document.getElementById('licenseValidUntil');

function formatDate(isoString) {
  if (!isoString) return '–';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function setLoginStatus(session) {
  if (!loginStatusEl || !loginEmailEl) return;
  if (session?.user) {
    loginStatusEl.textContent = 'Ingelogd';
    loginStatusEl.className = 'ok';
    loginEmailEl.textContent = session.user.email || session.user.id || '';
    loginEmailEl.className = 'muted';
  } else {
    loginStatusEl.textContent = 'Niet ingelogd';
    loginStatusEl.className = 'error';
    loginEmailEl.textContent = 'Log in om je licentie te controleren.';
    loginEmailEl.className = 'muted';
  }
}

function setLicenseInfo(data) {
  if (!licenseStatusEl || !licensePlanEl || !licenseValidUntilEl) return;
  const status = data?.status ?? 'onbekend';
  const plan = data?.plan ?? null;
  const validUntil = data?.validUntil ?? null;

  licensePlanEl.textContent = plan ? `Plan: ${plan}` : '';

  if (status === 'active') {
    licenseStatusEl.textContent = 'Licentie geldig';
    licenseStatusEl.className = 'ok';
    licenseValidUntilEl.textContent = validUntil
      ? `Geldig tot: ${formatDate(validUntil)}`
      : 'Geen einddatum';
  } else if (status === 'expired') {
    licenseStatusEl.textContent = 'Licentie verlopen';
    licenseStatusEl.className = 'error';
    licenseValidUntilEl.textContent = validUntil
      ? `Was geldig tot: ${formatDate(validUntil)}`
      : '';
  } else {
    licenseStatusEl.textContent = 'Geen licentie';
    licenseStatusEl.className = 'warn';
    licenseValidUntilEl.textContent = '';
  }
  licenseValidUntilEl.className = 'muted';
}

// Bij laden: inlogstatus tonen
(async function initLoginStatus() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      loginStatusEl.textContent = 'Fout bij ophalen sessie';
      loginStatusEl.className = 'error';
      loginEmailEl.textContent = error.message || '';
      return;
    }
    setLoginStatus(session);
  } catch (err) {
    console.error('[main.js] initLoginStatus:', err);
    if (loginStatusEl) {
      loginStatusEl.textContent = 'Fout';
      loginStatusEl.className = 'error';
    }
  }
})();

// Luister naar auth changes (inloggen/uitloggen elders)
supabase.auth.onAuthStateChange((_event, session) => {
  setLoginStatus(session);
});

const checkBtn = document.getElementById('checkBtn');
if (!checkBtn) {
  console.error('[main.js] Geen element met id="checkBtn" gevonden');
} else {
  checkBtn.addEventListener('click', async () => {
    console.log('[main.js] Knop "Check License" geklikt');
    licenseStatusEl.textContent = 'Controleren…';
    licenseStatusEl.className = '';
    licensePlanEl.textContent = '';
    licenseValidUntilEl.textContent = '';

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[main.js] Supabase getSession error:', sessionError);
        licenseStatusEl.textContent = 'Fout bij ophalen sessie';
        licenseStatusEl.className = 'error';
        alert('Fout bij verbinding met server');
        return;
      }
      const access_token = session?.access_token ?? null;
      if (!access_token) {
        setLicenseInfo(null);
        licenseStatusEl.textContent = 'Niet ingelogd';
        licenseStatusEl.className = 'warn';
        licensePlanEl.textContent = 'Log in om je licentie te checken.';
        alert('Niet ingelogd. Log in om je licentie te checken.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/license/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('[main.js] License response:', data);

      setLicenseInfo(data);
    } catch (err) {
      console.error('[main.js] Fout bij license check:', err);
      licenseStatusEl.textContent = 'Fout bij verbinding met server';
      licenseStatusEl.className = 'error';
      licensePlanEl.textContent = '';
      licenseValidUntilEl.textContent = '';
      alert('Fout bij verbinding met server');
    }
  });
}

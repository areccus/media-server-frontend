// app.jsx — Plex media app shell

// ─────────────────────────────────────────────────────────────────────────────
// Splash Screen
// ─────────────────────────────────────────────────────────────────────────────

function SplashScreen() {
  const [phase, setPhase] = React.useState('enter'); // enter → hold → exit
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className={'splash splash--' + phase}>
      <div className="splash__logo">HALO</div>
      <div className="splash__tagline">Your personal universe of content</div>
      <div className="splash__bar"><div className="splash__bar-fill" /></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Picker — "Who's Watching?" overlay
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePicker({ onSelect, onClose }) {
  const [profiles, setProfiles]   = useState([]);
  const [mode, setMode]           = useState('pick'); // 'pick' | 'add' | 'edit'
  const [editing, setEditing]     = useState(null);   // profile object being edited
  const [formName, setFormName]   = useState('');
  const [formAvatar, setFormAvatar] = useState('🦊');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const AVATARS = ['🦊','🐱','🐶','🐸','🦁','🐼','🐧','🦄','🎬','🎮','🎵','⭐','🌙','🌸','🔥','💫'];

  useEffect(() => { loadProfiles(); }, []);

  async function loadProfiles() {
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles`);
      const d = await r.json();
      if (d.success) setProfiles(d.data);
    } catch (_) {}
  }

  async function createProfile() {
    if (!formName.trim()) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), avatar: formAvatar })
      });
      const d = await r.json();
      if (d.success) { resetForm(); loadProfiles(); }
    } catch (_) {}
  }

  async function saveEdit() {
    if (!formName.trim() || !editing) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), avatar: formAvatar })
      });
      const d = await r.json();
      if (d.success) {
        // Update currentProfile if this is the active one
        if (window.currentProfileId === editing.id) {
          window.currentProfile = d.data;
        }
        resetForm();
        loadProfiles();
      }
    } catch (_) {}
  }

  async function deleteProfile() {
    if (!editing) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles/${editing.id}`, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) {
        // If we deleted the active profile, force re-selection
        if (window.currentProfileId === editing.id) {
          localStorage.removeItem('currentProfileId');
          window.currentProfile   = null;
          window.currentProfileId = null;
        }
        resetForm();
        loadProfiles();
      }
    } catch (_) {}
  }

  function openEdit(p, e) {
    e.stopPropagation();
    setEditing(p);
    setFormName(p.name);
    setFormAvatar(p.avatar);
    setConfirmDelete(false);
    setMode('edit');
  }

  function openAdd() {
    setFormName('');
    setFormAvatar('🦊');
    setMode('add');
  }

  function resetForm() {
    setMode('pick');
    setEditing(null);
    setFormName('');
    setFormAvatar('🦊');
    setConfirmDelete(false);
  }

  function selectProfile(profile) {
    localStorage.setItem('currentProfileId', String(profile.id));
    window.currentProfile   = profile;
    window.currentProfileId = profile.id;
    onSelect(profile);
  }

  const pickerStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(6,8,12,0.97)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, fontFamily: 'var(--font-sans, "Geist", sans-serif)',
    padding: '32px 16px'
  };

  const profileCardStyle = (hovered) => ({
    background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '28px 20px',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
    width: '130px', minHeight: '130px',
    transition: 'background .15s, transform .15s',
    transform: hovered ? 'translateY(-4px)' : 'none',
    color: '#fff', position: 'relative'
  });

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', color: '#fff',
    fontSize: '16px', fontFamily: 'inherit', outline: 'none'
  };

  const btnPrimary = {
    padding: '10px 28px', background: '#5BB7FF', color: '#06080c',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
  };

  const btnGlass = {
    padding: '10px 28px', background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px',
    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
  };

  const btnDanger = {
    padding: '10px 28px', background: 'rgba(220,50,50,0.15)', color: '#ff6b6b',
    border: '1px solid rgba(220,50,50,0.3)', borderRadius: '8px',
    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
  };

  const avatarGrid = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
      {AVATARS.map(a => (
        <button key={a} onClick={() => setFormAvatar(a)}
          style={{
            fontSize: '28px', cursor: 'pointer', background: 'none', border: 'none',
            padding: '6px', borderRadius: '8px', lineHeight: 1,
            outline: formAvatar === a ? '2px solid #5BB7FF' : 'none'
          }}>
          {a}
        </button>
      ))}
    </div>
  );

  // ── Add Profile ────────────────────────────────────────────────────────────
  if (mode === 'add') {
    return (
      <div style={pickerStyle}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '32px', color: '#fff' }}>
          Create Profile
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '360px' }}>
          <input autoFocus value={formName} onChange={e => setFormName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProfile()}
            placeholder="Name" style={inputStyle} />
          {avatarGrid}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={createProfile} style={btnPrimary}>Create</button>
            <button onClick={resetForm} style={btnGlass}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit Profile ───────────────────────────────────────────────────────────
  if (mode === 'edit' && editing) {
    const isOnly = profiles.length <= 1;
    return (
      <div style={pickerStyle}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '32px', color: '#fff' }}>
          Edit Profile
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '360px' }}>
          <span style={{ fontSize: '56px', lineHeight: 1 }}>{formAvatar}</span>
          <input autoFocus value={formName} onChange={e => setFormName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            placeholder="Name" style={inputStyle} />
          {avatarGrid}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={saveEdit} style={btnPrimary}>Save</button>
            <button onClick={resetForm} style={btnGlass}>Cancel</button>
          </div>

          {/* Delete section */}
          {!isOnly && (
            <div style={{ marginTop: '8px', width: '100%', textAlign: 'center' }}>
              {confirmDelete ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>
                    Delete "{editing.name}"? This removes all watch history for this profile.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={deleteProfile} style={btnDanger}>Yes, Delete</button>
                    <button onClick={() => setConfirmDelete(false)} style={btnGlass}>Keep It</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.6)',
                    fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Profile Picker (main) ──────────────────────────────────────────────────
  return (
    <div style={pickerStyle}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '40px', color: '#fff', letterSpacing: '-.01em' }}>
        Who's Watching?
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '680px', padding: '12px' }}>
        {profiles.map(p => (
          <div key={p.id} style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}>
            <button
              style={profileCardStyle(hoveredId === p.id)}
              onClick={() => selectProfile(p)}>
              <span style={{ fontSize: '52px', lineHeight: 1 }}>{p.avatar}</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</span>
            </button>
            {/* Edit pencil — hover on desktop, always visible on touch */}
            <button
              className="profile-edit-btn"
              onClick={e => openEdit(p, e)}
              aria-label={`Edit ${p.name}`}
              style={{
                position: 'absolute', top: '-10px', right: '-10px',
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(20,20,28,0.88)', border: '1.5px solid rgba(255,255,255,0.28)',
                color: '#fff', display: 'grid', placeItems: 'center',
                cursor: 'pointer', padding: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                transition: 'transform .15s, background .15s',
              }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        ))}
        <button
          style={profileCardStyle(hoveredId === 'add')}
          onMouseEnter={() => setHoveredId('add')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={openAdd}>
          <span style={{ fontSize: '40px', lineHeight: 1, color: 'rgba(255,255,255,0.4)' }}>+</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Add Profile</span>
        </button>
      </div>
      {onClose && (
        <button onClick={onClose}
          style={{ marginTop: '40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Continue as {window.currentProfile?.name || 'Guest'}
        </button>
      )}
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "aurora",
  "glowMode": "tone",
  "glowIntensity": 1.7,
  "cardRadius": 21,
  "ambientIntensity": 1,
  "fontFamily": "geist",
  "showPickup": true,
  "showTop10": true,
  "showNowDock": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useRouter();
  const [active, setActive] = useState('home');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [heroTone, setHeroTone] = useState('#5BB7FF');
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('plex.sidebar.collapsed') === '1'; } catch { return false; }
  });
  const bp = useBreakpoint();
  const compact = bp === 'phone' || bp === 'tablet';

  // Profile state
  const [profileReady, setProfileReady] = useState(() =>
    !!localStorage.getItem('currentProfileId')
  );
  const [showPicker, setShowPicker] = useState(false);
  const [, forceUpdate] = useState(0);

  // Expose showProfilePicker globally
  useEffect(() => {
    window.showProfilePicker = () => setShowPicker(true);
    return () => { delete window.showProfilePicker; };
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await window.initializeData();
      // Sync profile from localStorage after API_BASE_URL is ready
      const storedId = parseInt(localStorage.getItem('currentProfileId') || '0');
      if (storedId) {
        try {
          const r = await fetch(`${window.API_BASE_URL}/profiles`);
          const d = await r.json();
          if (d.success) {
            const found = d.data.find(p => p.id === storedId);
            if (found) {
              window.currentProfile   = found;
              window.currentProfileId = found.id;
              forceUpdate(n => n + 1);
            } else {
              localStorage.removeItem('currentProfileId');
              setProfileReady(false);
            }
          }
        } catch (_) {}
      }
      setDataLoaded(true);
      if (HERO_LIST.length > 0 && ITEMS[HERO_LIST[0]]) {
        setHeroTone(ITEMS[HERO_LIST[0]].tone);
      }
    };
    loadData();
  }, []);

  function toggleCollapsed() {
    setCollapsed(c => {
      const v = !c;
      try { localStorage.setItem('plex.sidebar.collapsed', v ? '1' : '0'); } catch {}
      return v;
    });
  }

  // apply font family
  useEffect(() => {
    document.documentElement.dataset.font = t.fontFamily || 'geist';
  }, [t.fontFamily]);

  // Show loading state while data is being fetched
  if (!dataLoaded) {
    return <SplashScreen />;
  }

  // Show profile picker if no profile selected yet, or user triggered it
  if (!profileReady || showPicker) {
    return (
      <div className={'app app--' + t.variant} data-bp={bp}>
        <AmbientBg variant={t.variant} accentColor={heroTone} intensity={t.ambientIntensity}/>
        <ProfilePicker
          onSelect={(profile) => {
            setProfileReady(true);
            setShowPicker(false);
            forceUpdate(n => n + 1);
          }}
          onClose={profileReady ? () => setShowPicker(false) : null}
        />
      </div>
    );
  }

  // Render category pages based on route
  function renderContent() {
    // Handle detail page
    if (route.page === 'detail' && route.params) {
      return (
        <DetailPage
          mediaType={route.params.mediaType}
          mediaId={route.params.mediaId}
        />
      );
    }

    // Handle search page
    if (route.page === 'search') {
      return <SearchPage />;
    }

    // Handle library page
    if (route.page === 'library') {
      return <LibraryPage />;
    }

    if (route.page === 'history') {
      return <HistoryPage />;
    }

    // Handle genre pages
    if (route.page === 'movies') {
      return <GenrePage type="movies" title="Movies" />;
    }

    if (route.page === 'tv') {
      return <GenrePage type="tv" title="TV Shows" />;
    }

    if (route.page === 'anime') {
      return <GenrePage type="anime" title="Anime" />;
    }

    // Handle category pages (trending, recommended, etc.)
    const categoryConfig = {
      'trending': { title: 'Trending', endpoint: '/trending?type=all' },
      'recommended': { title: 'Recommended For You', endpoint: '/recommended' },
      'tv-shows': { title: 'TV Shows', endpoint: '/tv' }
    };

    const config = categoryConfig[route.page];
    if (config) {
      return (
        <CategoryPage
          category={route.page}
          title={config.title}
          fetchEndpoint={config.endpoint}
        />
      );
    }

    // Default home page
    return (
      <>
        <Hero heroIds={HERO_LIST} onHeroChange={setHeroTone}
              glassRadius={t.cardRadius} glassStrength={1}/>

        {t.showPickup && <PickupSpread profileId={window.currentProfileId}/>}
        <MoodRail/>

        <div className="rows">
          {ROWS.map(r => {
            if (r.id === 'tr' && t.showTop10) {
              return <Top10Row key={r.id} row={r}
                glowMode={t.glowMode}
                glowIntensity={t.glowIntensity}
                cardRadius={t.cardRadius}/>;
            }
            return (
              <Row key={r.id} row={r}
                glowMode={t.glowMode}
                glowIntensity={t.glowIntensity}
                cardRadius={t.cardRadius}/>
            );
          })}
          <div className="footer-pad"></div>
        </div>

        {t.showNowDock && <NowDock profileId={window.currentProfileId}/>}
      </>
    );
  }

  return (
    <div className={'app app--' + t.variant + (collapsed && !compact ? ' app--collapsed' : '')} data-bp={bp}>
      <AmbientBg variant={t.variant} accentColor={heroTone} intensity={t.ambientIntensity}/>

      {compact
        ? <TopBar active={active} setActive={setActive}/>
        : <Sidebar active={active} setActive={setActive} collapsed={collapsed} toggleCollapsed={toggleCollapsed}/>}

      <main className="main">
        {renderContent()}
      </main>

      <TweaksPanel>
        <TweakSection label="Style"/>
        <TweakRadio label="Variant" value={t.variant}
          options={[{value:'aurora',label:'Aurora'},{value:'obsidian',label:'Obsidian'}]}
          onChange={v => setTweak('variant', v)}/>
        <TweakRadio label="Glow source" value={t.glowMode}
          options={[{value:'tone',label:'Poster color'},{value:'blue',label:'Plex blue'}]}
          onChange={v => setTweak('glowMode', v)}/>
        <TweakSlider label="Glow intensity" value={t.glowIntensity} min={0} max={3} step={0.05}
          onChange={v => setTweak('glowIntensity', v)}/>
        <TweakSlider label="Card radius" value={t.cardRadius} min={0} max={60} step={1} unit="px"
          onChange={v => setTweak('cardRadius', v)}/>
        <TweakSection label="Background"/>
        <TweakSlider label="Ambient motion" value={t.ambientIntensity} min={0} max={1.5} step={0.05}
          onChange={v => setTweak('ambientIntensity', v)}/>
        <TweakSection label="Type"/>
        <TweakRadio label="Family" value={t.fontFamily}
          options={[{value:'geist',label:'Geist'},{value:'instrument',label:'Instrument'},{value:'mono',label:'Mono'}]}
          onChange={v => setTweak('fontFamily', v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

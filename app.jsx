// app.jsx — Plex media app shell

// ─────────────────────────────────────────────────────────────────────────────
// Profile Picker — "Who's Watching?" overlay
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePicker({ onSelect, onClose }) {
  const [profiles, setProfiles]   = useState([]);
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState('');
  const [newAvatar, setNewAvatar] = useState('🦊');

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
    if (!newName.trim()) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), avatar: newAvatar })
      });
      const d = await r.json();
      if (d.success) {
        setAdding(false);
        setNewName('');
        setNewAvatar('🦊');
        loadProfiles();
      }
    } catch (_) {}
  }

  function selectProfile(profile) {
    localStorage.setItem('currentProfileId', String(profile.id));
    window.currentProfile   = profile;
    window.currentProfileId = profile.id;
    onSelect(profile);
  }

  const [hoveredId, setHoveredId] = useState(null);

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
    color: '#fff'
  });

  if (adding) {
    return (
      <div style={pickerStyle}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '32px', color: '#fff' }}>
          Create Profile
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '360px' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProfile()}
            placeholder="Name"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', color: '#fff',
              fontSize: '16px', fontFamily: 'inherit', outline: 'none'
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setNewAvatar(a)}
                style={{
                  fontSize: '28px', cursor: 'pointer', background: 'none', border: 'none',
                  padding: '6px', borderRadius: '8px', lineHeight: 1,
                  outline: newAvatar === a ? '2px solid #5BB7FF' : 'none'
                }}>
                {a}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={createProfile}
              style={{ padding: '10px 28px', background: '#5BB7FF', color: '#06080c', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Create
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); }}
              style={{ padding: '10px 28px', background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', fontSize: '14px',
                cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pickerStyle}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '40px', color: '#fff', letterSpacing: '-.01em' }}>
        Who's Watching?
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '680px' }}>
        {profiles.map(p => (
          <button key={p.id}
            style={profileCardStyle(hoveredId === p.id)}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => selectProfile(p)}>
            <span style={{ fontSize: '52px', lineHeight: 1 }}>{p.avatar}</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</span>
          </button>
        ))}
        <button
          style={profileCardStyle(hoveredId === 'add')}
          onMouseEnter={() => setHoveredId('add')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => setAdding(true)}>
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
  "fontFamily": "geist"
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
    return (
      <div className={'app app--' + t.variant} data-bp={bp} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <AmbientBg variant={t.variant} accentColor={heroTone} intensity={t.ambientIntensity}/>
        <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-sans)', position: 'relative', zIndex: 2}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>🎬</div>
          <div style={{fontSize: '18px', fontWeight: 600, marginBottom: '8px'}}>Loading Plex Media Server</div>
          <div style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)'}}>Fetching content from TMDB...</div>
        </div>
      </div>
    );
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

        <div className="rows">
          {ROWS.map(r => (
            <Row key={r.id} row={r}
              glowMode={t.glowMode}
              glowIntensity={t.glowIntensity}
              cardRadius={t.cardRadius}
            />
          ))}
          <div className="footer-pad"></div>
        </div>
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

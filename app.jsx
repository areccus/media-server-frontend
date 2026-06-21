/* app.jsx — HALO Media Server */

/* ── Splash screen ───────────────────────────────────────────────────────── */
function SplashScreen() {
  const [phase, setPhase] = React.useState('enter');
  React.useEffect(() => {
    const t = setTimeout(() => setPhase('hold'), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={'splash splash--' + phase}>
      <div className="splash__logo">HALO</div>
      <div className="splash__tagline">Your personal universe of content</div>
      <div className="splash__bar"><div className="splash__bar-fill"/></div>
    </div>
  );
}

/* ── Profile Picker ──────────────────────────────────────────────────────── */
function ProfilePicker({ onSelect, onClose }) {
  const [profiles, setProfiles]   = React.useState([]);
  const [mode, setMode]           = React.useState('pick');
  const [editing, setEditing]     = React.useState(null);
  const [formName, setFormName]   = React.useState('');
  const [formAvatar, setFormAvatar] = React.useState('🦊');
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState(null);

  const AVATARS = ['🦊','🐱','🐶','🐸','🦁','🐼','🐧','🦄','🎬','🎮','🎵','⭐','🌙','🌸','🔥','💫'];

  React.useEffect(() => { loadProfiles(); }, []);

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
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: formName.trim(), avatar: formAvatar})
      });
      const d = await r.json();
      if (d.success) { resetForm(); loadProfiles(); }
    } catch (_) {}
  }

  async function saveEdit() {
    if (!formName.trim() || !editing) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles/${editing.id}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: formName.trim(), avatar: formAvatar})
      });
      const d = await r.json();
      if (d.success) {
        if (window.currentProfileId === editing.id) window.currentProfile = d.data;
        resetForm(); loadProfiles();
      }
    } catch (_) {}
  }

  async function deleteProfile() {
    if (!editing) return;
    try {
      const r = await fetch(`${window.API_BASE_URL}/profiles/${editing.id}`, {method: 'DELETE'});
      const d = await r.json();
      if (d.success) {
        if (window.currentProfileId === editing.id) {
          localStorage.removeItem('currentProfileId');
          window.currentProfile = null; window.currentProfileId = null;
        }
        resetForm(); loadProfiles();
      }
    } catch (_) {}
  }

  function openEdit(p, e) {
    e.stopPropagation();
    setEditing(p); setFormName(p.name); setFormAvatar(p.avatar);
    setConfirmDelete(false); setMode('edit');
  }

  function resetForm() {
    setMode('pick'); setEditing(null); setFormName(''); setFormAvatar('🦊'); setConfirmDelete(false);
  }

  function selectProfile(profile) {
    localStorage.setItem('currentProfileId', String(profile.id));
    window.currentProfile = profile; window.currentProfileId = profile.id;
    onSelect(profile);
  }

  const S = {
    wrap: {position:'fixed',inset:0,background:'rgba(6,8,12,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'32px 16px'},
    card: (hov) => ({background:hov?'rgba(255,255,255,.07)':'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'16px',padding:'28px 20px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',width:'130px',minHeight:'130px',transition:'background .15s, transform .15s',transform:hov?'translateY(-4px)':'none',color:'#fff',position:'relative'}),
    input: {width:'100%',padding:'12px 16px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.15)',borderRadius:'10px',color:'#fff',fontSize:'16px',fontFamily:'inherit',outline:'none'},
    btnPrimary: {padding:'10px 28px',background:'#5BB7FF',color:'#06080c',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
    btnGlass: {padding:'10px 28px',background:'rgba(255,255,255,.08)',color:'#fff',border:'1px solid rgba(255,255,255,.14)',borderRadius:'8px',fontSize:'14px',cursor:'pointer',fontFamily:'inherit'},
    btnDanger: {padding:'10px 28px',background:'rgba(220,50,50,.15)',color:'#ff6b6b',border:'1px solid rgba(220,50,50,.3)',borderRadius:'8px',fontSize:'14px',cursor:'pointer',fontFamily:'inherit'},
  };

  const avatarGrid = (
    <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center'}}>
      {AVATARS.map(a => (
        <button key={a} onClick={() => setFormAvatar(a)}
          style={{fontSize:'28px',cursor:'pointer',background:'none',border:'none',padding:'6px',borderRadius:'8px',lineHeight:1,outline:formAvatar===a?'2px solid #5BB7FF':'none'}}>
          {a}
        </button>
      ))}
    </div>
  );

  if (mode === 'add') return (
    <div style={S.wrap}>
      <h1 style={{fontSize:'26px',fontWeight:600,marginBottom:'32px',color:'#fff'}}>Create Profile</h1>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',width:'100%',maxWidth:'360px'}}>
        <input autoFocus value={formName} onChange={e=>setFormName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&createProfile()} placeholder="Name" style={S.input}/>
        {avatarGrid}
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={createProfile} style={S.btnPrimary}>Create</button>
          <button onClick={resetForm} style={S.btnGlass}>Cancel</button>
        </div>
      </div>
    </div>
  );

  if (mode === 'edit' && editing) return (
    <div style={S.wrap}>
      <h1 style={{fontSize:'26px',fontWeight:600,marginBottom:'32px',color:'#fff'}}>Edit Profile</h1>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',width:'100%',maxWidth:'360px'}}>
        <span style={{fontSize:'56px',lineHeight:1}}>{formAvatar}</span>
        <input autoFocus value={formName} onChange={e=>setFormName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&saveEdit()} placeholder="Name" style={S.input}/>
        {avatarGrid}
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={saveEdit} style={S.btnPrimary}>Save</button>
          <button onClick={resetForm} style={S.btnGlass}>Cancel</button>
        </div>
        {profiles.length > 1 && (
          <div style={{marginTop:'8px',width:'100%',textAlign:'center'}}>
            {confirmDelete
              ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px'}}>
                  <p style={{color:'#ff6b6b',fontSize:'13px',margin:0}}>Delete "{editing.name}"? This removes all watch history for this profile.</p>
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={deleteProfile} style={S.btnDanger}>Yes, Delete</button>
                    <button onClick={()=>setConfirmDelete(false)} style={S.btnGlass}>Keep It</button>
                  </div>
                </div>
              : <button onClick={()=>setConfirmDelete(true)}
                  style={{background:'none',border:'none',color:'rgba(255,100,100,.6)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>
                  Delete profile
                </button>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <h1 style={{fontSize:'28px',fontWeight:600,marginBottom:'40px',color:'#fff',letterSpacing:'-.01em'}}>Who's Watching?</h1>
      <div style={{display:'flex',flexWrap:'wrap',gap:'16px',justifyContent:'center',maxWidth:'680px',padding:'12px'}}>
        {profiles.map(p => (
          <div key={p.id} style={{position:'relative'}}
            onMouseEnter={()=>setHoveredId(p.id)} onMouseLeave={()=>setHoveredId(null)}>
            <button style={S.card(hoveredId===p.id)} onClick={()=>selectProfile(p)}>
              <span style={{fontSize:'52px',lineHeight:1}}>{p.avatar}</span>
              <span style={{fontSize:'14px',fontWeight:500}}>{p.name}</span>
            </button>
            <button className="profile-edit-btn" onClick={e=>openEdit(p,e)} aria-label={`Edit ${p.name}`}
              style={{position:'absolute',top:'-10px',right:'-10px',width:'34px',height:'34px',borderRadius:'50%',background:'rgba(20,20,28,.88)',border:'1.5px solid rgba(255,255,255,.28)',color:'#fff',display:'grid',placeItems:'center',cursor:'pointer',padding:0,boxShadow:'0 2px 8px rgba(0,0,0,.5)',transition:'transform .15s, background .15s'}}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        ))}
        <button style={S.card(hoveredId==='add')}
          onMouseEnter={()=>setHoveredId('add')} onMouseLeave={()=>setHoveredId(null)}
          onClick={()=>{ setFormName(''); setFormAvatar('🦊'); setMode('add'); }}>
          <span style={{fontSize:'40px',lineHeight:1,color:'rgba(255,255,255,.4)'}}>+</span>
          <span style={{fontSize:'14px',fontWeight:500,color:'rgba(255,255,255,.5)'}}>Add Profile</span>
        </button>
      </div>
      {onClose && (
        <button onClick={onClose}
          style={{marginTop:'40px',background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>
          Continue as {window.currentProfile?.name || 'Guest'}
        </button>
      )}
    </div>
  );
}

/* ── Build hero-enriched item ────────────────────────────────────────────── */
function makeHero(item, i) {
  const ranks = ['#1 in Trending Today', 'Trending #2', 'Critics\' Pick', '#3 in Movies Today', '#1 in Action'];
  const matches = [97, 94, 96, 93, 98];
  return {
    ...item,
    _match: matches[i % matches.length],
    _rank: ranks[i % ranks.length],
  };
}

/* ── Row layout + tab config ─────────────────────────────────────────────── */
const ROW_CONFIG = {
  tr:  { layout: 'portrait',  tabs: ['home'],                    label: "What's Hot" },
  rec: { layout: 'portrait',  tabs: ['home'],                    label: 'Recommended For You' },
  mv:  { layout: 'landscape', tabs: ['home', 'movies'],          label: 'Popular Movies' },
  tv:  { layout: 'landscape', tabs: ['home', 'series'],          label: 'TV Shows' },
  an:  { layout: 'landscape', tabs: ['home', 'anime'],           label: 'Anime' },
  cont:{ layout: 'continue',  tabs: ['home', 'movies', 'series'],label: 'Continue Watching' },
};

/* ── Genre rows inline on non-home tabs ─────────────────────────────────── */
const GENRE_ENDPOINT = {
  movies: '/movies/genres',
  series: '/tv/genres',
  anime:  '/anime/genres',
  kids:   '/kids/genres',
};
const GENRE_MEDIA_TYPE = {
  movies: 'movies',
  series: 'tv',
  anime:  'anime',
  kids:   'kids',
};

function GenreTabRows({ tab, onOpen }) {
  const [genreData, setGenreData] = React.useState(null);
  const endpoint = GENRE_ENDPOINT[tab];

  React.useEffect(() => {
    setGenreData(null);
    if (!endpoint) return;
    window.fetchWithCache(endpoint)
      .then(data => setGenreData(data || {}))
      .catch(() => {});
  }, [tab]);

  if (!genreData) return null;

  const mediaType = GENRE_MEDIA_TYPE[tab];

  return (
    <React.Fragment>
      {Object.entries(genreData).map(([genreName, items]) =>
        items.length > 0 ? (
          <LazyGenreRow
            key={genreName}
            genreName={genreName}
            items={items}
            onOpen={onOpen}
            mediaType={mediaType}
          />
        ) : null
      )}
    </React.Fragment>
  );
}

/* ── Main App ────────────────────────────────────────────────────────────── */
const TWEAK_DEFAULTS = {
  "variant": "aurora",
  "glowStrength": 1,
  "cardRadius": 14,
  "ambientIntensity": 1,
  "fontFamily": "geist",
  "heroSpeed": 8,
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useRouter();

  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [tab, setTab] = React.useState('home');
  const [heroIdx, setHeroIdx] = React.useState(0);
  const [heroPaused, setHeroPaused] = React.useState(false);
  const [mobileScreen, setMobileScreen] = React.useState('home');
  const [contItems, setContItems] = React.useState([]);

  const [profileReady, setProfileReady] = React.useState(() => !!localStorage.getItem('currentProfileId'));
  const [showPicker, setShowPicker] = React.useState(false);
  const [, forceUpdate] = React.useState(0);

  const bgRef = React.useRef(null);
  const overTimerRef = React.useRef(null);

  /* ── Expose profile picker globally ──── */
  React.useEffect(() => {
    window.showProfilePicker = () => setShowPicker(true);
    return () => { delete window.showProfilePicker; };
  }, []);

  /* ── Pre-warm genre caches so tab switches feel instant ──── */
  React.useEffect(() => {
    Object.values(GENRE_ENDPOINT).forEach(ep => window.fetchWithCache(ep).catch(() => {}));
  }, []);

  /* ── Load data ──── */
  React.useEffect(() => {
    async function load() {
      await window.initializeData();
      const storedId = parseInt(localStorage.getItem('currentProfileId') || '0');
      if (storedId) {
        try {
          const r = await fetch(`${window.API_BASE_URL}/profiles`);
          const d = await r.json();
          if (d.success) {
            const found = d.data.find(p => p.id === storedId);
            if (found) { window.currentProfile = found; window.currentProfileId = found.id; forceUpdate(n => n+1); }
            else { localStorage.removeItem('currentProfileId'); setProfileReady(false); }
          }
        } catch (_) {}
      }
      setDataLoaded(true);
    }
    load();
  }, []);

  /* ── Load continue watching ──── */
  React.useEffect(() => {
    if (!dataLoaded) return;
    const pid = window.currentProfileId || 1;
    fetch(`${window.API_BASE_URL}/progress/continue-watching?profile_id=${pid}`)
      .then(r => r.json())
      .then(d => {
        const items = (d.data || []).map(it => {
          const key = `${it.media_type}_${it.media_id}`;
          const base = ITEMS[key];
          if (!base) return null;
          return { ...base, progress: it.progress || 0, timeLeft: it.time_left || '' };
        }).filter(Boolean);
        setContItems(items);
      })
      .catch(() => {});
  }, [dataLoaded, profileReady]);

  /* ── matchMedia compact toggle ──── */
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width:820px)');
    const apply = () => document.documentElement.classList.toggle('compact', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* ── Apply tweaks ──── */
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--glow-strength', t.glowStrength || 1);
    r.setProperty('--card-radius', (t.cardRadius || 14) + 'px');
    r.setProperty('--accent', '#2f86ff');
    r.setProperty('--accent-2', '#5468ff');
    document.documentElement.dataset.font = t.fontFamily || 'geist';
  }, [t]);

  /* ── Hero list ──── */
  const heroList = React.useMemo(() => {
    if (!dataLoaded) return [];
    return HERO_LIST.map((id, i) => {
      const item = ITEMS[id];
      return item ? makeHero(item, i) : null;
    }).filter(Boolean);
  }, [dataLoaded]);

  /* ── Auto-rotate hero ──── */
  React.useEffect(() => {
    if (heroPaused || heroList.length === 0) return;
    const speed = (t.heroSpeed || 8) * 1000;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % heroList.length), speed);
    return () => clearInterval(id);
  }, [heroList, heroPaused, t.heroSpeed]);

  const hero = heroList[heroIdx] || heroList[0] || null;

  /* ── Sync #bg and --glow with hero ──── */
  React.useEffect(() => {
    if (!hero) return;
    document.documentElement.style.setProperty('--glow', hero.tone || '#2f86ff');
    const bg = document.getElementById('bg');
    if (bg) {
      const src = hero.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${hero.backdrop_path}`
        : backdropUrl(hero);
      if (src) bg.style.backgroundImage = `url(${src})`;
    }
  }, [hero?.id]);

  /* ── Build rows for current tab ──── */
  const rows = React.useMemo(() => {
    if (!dataLoaded) return [];
    const result = [];

    // Continue watching row — filter by tab so movies don't appear on TV tab and vice versa
    const cwFiltered = tab === 'movies'
      ? contItems.filter(i => i.id.startsWith('movie_'))
      : tab === 'series'
      ? contItems.filter(i => i.id.startsWith('tv_'))
      : contItems;

    if (cwFiltered.length > 0 && ['home','movies','series'].includes(tab)) {
      result.push({ id: 'cont', label: 'Continue Watching', layout: 'continue', items: cwFiltered });
    }

    // IDs already shown in CW — exclude them from browse rows so nothing appears twice
    const cwIdSet = new Set(cwFiltered.map(i => i.id));

    // Backend rows filtered by tab
    for (const row of ROWS) {
      const cfg = ROW_CONFIG[row.id];
      if (!cfg) continue;
      if (!cfg.tabs.includes(tab)) continue;
      const dedupedItems = (row.items || []).filter(id => !cwIdSet.has(id));
      result.push({ ...row, layout: cfg.layout, label: cfg.label || row.label, items: dedupedItems });
    }

    return result;
  }, [dataLoaded, tab, contItems]);

  /* ── Card click → navigate to detail page ──── */
  function openItem(item) {
    const [type, id] = item.id.split('_');
    window.navigate(`detail/${type}/${id}`);
  }

  /* ── Mobile nav handler ──── */
  function handleMobileNav(id) {
    setMobileScreen(id);
    if (id === 'home') { setTab('home'); window.navigate('home'); }
    else if (id === 'search') window.navigate('search');
    else if (id === 'library') window.navigate('library');
    else if (id === 'account') window.showProfilePicker?.();
  }

  /* ── Tab change ──── */
  function handleTabChange(t) {
    setTab(t);
    window.navigate('home');
    setHeroIdx(0);
  }

  /* ── Splash ──── */
  if (!dataLoaded) return <SplashScreen/>;

  /* ── Profile picker ──── */
  if (!profileReady || showPicker) {
    return (
      <div className="app">
        <div id="bg" ref={bgRef}/>
        <ProfilePicker
          onSelect={() => { setProfileReady(true); setShowPicker(false); forceUpdate(n => n+1); }}
          onClose={profileReady ? () => setShowPicker(false) : null}/>
      </div>
    );
  }

  /* ── Non-home router pages ──── */
  /* ── Tab redirect for hash-based tab routes ──── */
  const tabRouteMap = { movies: 'movies', tv: 'series', anime: 'anime', sports: 'sports' };
  if (route.page && tabRouteMap[route.page] && tab !== tabRouteMap[route.page]) {
    setTab(tabRouteMap[route.page]);
    window.navigate('home');
  }

  const routerPages = { detail: true, search: true, library: true, history: true, genre: true, sport: true };

  if (route.page && route.page !== 'home' && routerPages[route.page]) {
    return (
      <React.Fragment>
        <div id="bg" ref={bgRef}/>
        <div className="app">
          <TopNav tab={tab} setTab={handleTabChange} sticky={true}/>
          <main className="inner-page">
            {route.page === 'detail' && route.params
              ? <DetailPage key={`${route.params.mediaType}_${route.params.mediaId}`} mediaType={route.params.mediaType} mediaId={route.params.mediaId}/>
              : route.page === 'search' ? <SearchPage/>
              : route.page === 'library' ? <LibraryPage/>
              : route.page === 'history' ? <HistoryPage/>
              : route.page === 'genre' ? <GenrePage mediaType={route.params.mediaType} initialGenre={route.params.genreName}/>
              : route.page === 'sport' ? <SportDetailPage gameId={route.params.gameId}/>
              : null}
          </main>
          <BottomBar active={mobileScreen} onNav={handleMobileNav}/>
        </div>
        <TweaksPanel>
          <TweakSection label="Style"/>
          <TweakSlider label="Glow intensity" value={t.glowStrength} min={0} max={2} step={0.05}
            onChange={v => setTweak('glowStrength', v)}/>
          <TweakSlider label="Card radius" value={t.cardRadius} min={0} max={30} step={1} unit="px"
            onChange={v => setTweak('cardRadius', v)}/>
          <TweakSlider label="Hero speed (s)" value={t.heroSpeed} min={4} max={20} step={1}
            onChange={v => setTweak('heroSpeed', v)}/>
        </TweaksPanel>
      </React.Fragment>
    );
  }

  /* ── Main home/tab view ──── */
  return (
    <React.Fragment>
      <div id="bg" ref={bgRef}/>
      <div className="app">
        <MobileTop tab={tab} setTab={handleTabChange}/>
        <Hero
          hero={hero}
          heroList={heroList}
          heroIdx={heroIdx}
          setHeroIdx={setHeroIdx}
          paused={heroPaused}
          setPaused={setHeroPaused}
          nav={<TopNav tab={tab} setTab={handleTabChange}/>}/>
        <div className="rails">
          {tab === 'kids' ? (
            <div className="coming-soon">
              <div className="coming-soon__word">Kids</div>
              <div className="coming-soon__tag">Coming soon</div>
            </div>
          ) : tab === 'sports' ? (
            <SportsPage/>
          ) : (
            <React.Fragment>
              {rows.map(r => <Row key={r.id} row={r} onOpen={openItem}/>)}
              {tab !== 'home' && <GenreTabRows tab={tab} onOpen={openItem}/>}
            </React.Fragment>
          )}
        </div>
        <BottomBar active={mobileScreen} onNav={handleMobileNav}/>
      </div>
      <TweaksPanel>
        <TweakSection label="Style"/>
        <TweakSlider label="Glow intensity" value={t.glowStrength} min={0} max={2} step={0.05}
          onChange={v => setTweak('glowStrength', v)}/>
        <TweakSlider label="Card radius" value={t.cardRadius} min={0} max={30} step={1} unit="px"
          onChange={v => setTweak('cardRadius', v)}/>
        <TweakSlider label="Hero speed (s)" value={t.heroSpeed} min={4} max={20} step={1}
          onChange={v => setTweak('heroSpeed', v)}/>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

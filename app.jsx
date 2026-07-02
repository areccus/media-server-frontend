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
  const [manageMode, setManageMode] = React.useState(false);   // Disney+/Netflix-style "Edit Profiles" toggle
  // PIN lock state
  const [pinTarget, setPinTarget]   = React.useState(null);  // profile awaiting PIN
  const [pinInput, setPinInput]     = React.useState('');
  const [pinError, setPinError]     = React.useState(false);
  const [pinSetting, setPinSetting] = React.useState('');    // for set-pin form in edit mode

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
    setMode('pick'); setEditing(null); setFormName(''); setFormAvatar('🦊');
    setConfirmDelete(false); setPinSetting('');
  }

  async function selectProfile(profile) {
    if (manageMode) { openEdit(profile, { stopPropagation(){} }); return; }
    const r = await fetch(`${window.API_BASE_URL}/profiles/${profile.id}/verify-pin`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pin: ''})
    });
    const d = await r.json().catch(() => ({verified: true, has_pin: false}));
    if (d.has_pin) {
      setPinTarget(profile); setPinInput(''); setPinError(false);
    } else {
      _doSelectProfile(profile);
    }
  }

  function _doSelectProfile(profile) {
    localStorage.setItem('currentProfileId', String(profile.id));
    window.currentProfile = profile; window.currentProfileId = profile.id;
    onSelect(profile);
  }

  async function submitPin() {
    if (!pinTarget || !pinInput) return;
    const r = await fetch(`${window.API_BASE_URL}/profiles/${pinTarget.id}/verify-pin`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pin: pinInput})
    });
    const d = await r.json().catch(() => ({verified: false}));
    if (d.verified) { _doSelectProfile(pinTarget); setPinTarget(null); }
    else { setPinError(true); setPinInput(''); }
  }

  async function savePinFromEdit() {
    if (!editing) return;
    await fetch(`${window.API_BASE_URL}/profiles/${editing.id}/pin`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pin: pinSetting})
    });
    setPinSetting('');
  }

  // Deterministic circle gradient per profile — same profile always gets the
  // same color across sessions and devices (keyed on id). Muted, single-hue
  // gradients (not rainbow-bright) read as premium rather than playful.
  const TILE_GRADS = [
    ['#1f4fa8', '#2f86ff'],   // halo blue
    ['#a83a5a', '#e0526e'],   // rose
    ['#0e7a5f', '#12a887'],   // emerald
    ['#5a2fa8', '#7d3fe0'],   // violet
    ['#7a3560', '#a83a7a'],   // plum
    ['#1a6f8f', '#2aa8d8'],   // ocean
  ];
  const gradFor = (id) => TILE_GRADS[Math.abs(id) % TILE_GRADS.length];

  const S = {
    wrap: {position:'fixed',inset:0,background:'radial-gradient(ellipse 90% 70% at 50% 40%, #12151d 0%, #06070a 65%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'32px 16px',overflowY:'auto'},
    kicker: {fontSize:'13px',fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.32)',marginBottom:'14px'},
    title: {fontSize:'clamp(26px, 3.4vw, 34px)',fontWeight:600,marginBottom:'56px',color:'#fff',letterSpacing:'-.01em'},
    circle: (id, hov, editMode) => ({width:'148px',height:'148px',borderRadius:'50%',padding:0,cursor:'pointer',display:'grid',placeItems:'center',background:`linear-gradient(150deg, ${gradFor(id)[0]}, ${gradFor(id)[1]})`,border:hov&&!editMode?'3px solid #fff':'3px solid transparent',transform:hov&&!editMode?'scale(1.06)':editMode?'scale(0.94)':'scale(1)',opacity:editMode?0.55:1,filter:editMode?'grayscale(0.15)':'none',transition:'transform .22s cubic-bezier(.22,.61,.36,1), border-color .18s, opacity .2s, box-shadow .22s',boxShadow:hov&&!editMode?'0 22px 48px -16px rgba(0,0,0,.8)':'0 12px 32px -18px rgba(0,0,0,.7)'}),
    circleAdd: (hov) => ({width:'148px',height:'148px',borderRadius:'50%',padding:0,cursor:'pointer',display:'grid',placeItems:'center',background:hov?'rgba(255,255,255,.07)':'rgba(255,255,255,.03)',border:`2px dashed rgba(255,255,255,${hov?'.55':'.24'})`,transform:hov?'scale(1.05)':'scale(1)',transition:'transform .22s cubic-bezier(.22,.61,.36,1), border-color .18s, background .18s'}),
    name: (hov) => ({fontSize:'16px',fontWeight:600,color:hov?'#fff':'rgba(255,255,255,.58)',transition:'color .15s',maxWidth:'148px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textAlign:'center'}),
    input: {width:'100%',padding:'13px 16px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.15)',borderRadius:'12px',color:'#fff',fontSize:'16px',fontFamily:'inherit',outline:'none'},
    btnPrimary: {padding:'12px 32px',background:'#fff',color:'#0a0b0d',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
    btnGlass: {padding:'12px 32px',background:'transparent',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.3)',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
    btnDanger: {padding:'12px 32px',background:'rgba(220,50,50,.15)',color:'#ff6b6b',border:'1px solid rgba(220,50,50,.3)',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  };

  const avatarGrid = (
    <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',maxWidth:'320px'}}>
      {AVATARS.map(a => (
        <button key={a} onClick={() => setFormAvatar(a)}
          style={{fontSize:'26px',cursor:'pointer',background:formAvatar===a?'rgba(47,134,255,.18)':'none',border:'none',padding:'7px',borderRadius:'10px',lineHeight:1,outline:formAvatar===a?'2px solid #2f86ff':'none'}}>
          {a}
        </button>
      ))}
    </div>
  );

  if (mode === 'add') return (
    <div style={S.wrap}>
      <h1 style={{fontSize:'24px',fontWeight:700,marginBottom:'36px',color:'#fff',letterSpacing:'-.01em'}}>Add Profile</h1>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'22px',width:'100%',maxWidth:'340px'}}>
        <div style={{width:'96px',height:'96px',borderRadius:'50%',display:'grid',placeItems:'center',background:'linear-gradient(150deg, #2a2d38, #1a1c24)',fontSize:'48px'}}>{formAvatar}</div>
        <input autoFocus value={formName} onChange={e=>setFormName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&createProfile()} placeholder="Name" style={S.input}/>
        {avatarGrid}
        <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
          <button onClick={resetForm} style={S.btnGlass}>Cancel</button>
          <button onClick={createProfile} style={S.btnPrimary}>Continue</button>
        </div>
      </div>
    </div>
  );

  if (mode === 'edit' && editing) return (
    <div style={S.wrap}>
      <h1 style={{fontSize:'24px',fontWeight:700,marginBottom:'36px',color:'#fff',letterSpacing:'-.01em'}}>Edit Profile</h1>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'22px',width:'100%',maxWidth:'340px'}}>
        <div style={{width:'96px',height:'96px',borderRadius:'50%',display:'grid',placeItems:'center',background:`linear-gradient(150deg, ${gradFor(editing.id)[0]}, ${gradFor(editing.id)[1]})`,fontSize:'48px'}}>{formAvatar}</div>
        <input autoFocus value={formName} onChange={e=>setFormName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&saveEdit()} placeholder="Name" style={S.input}/>
        {avatarGrid}
        <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
          <button onClick={resetForm} style={S.btnGlass}>Cancel</button>
          <button onClick={saveEdit} style={S.btnPrimary}>Save</button>
        </div>
        <div style={{width:'100%',borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:'18px',marginTop:'6px'}}>
          <p style={{color:'rgba(255,255,255,.4)',fontSize:'12px',margin:'0 0 8px',textAlign:'center'}}>
            Profile PIN (leave blank to remove)
          </p>
          <div style={{display:'flex',gap:'8px'}}>
            <input type="password" inputMode="numeric" maxLength={8}
              value={pinSetting} onChange={e=>setPinSetting(e.target.value)}
              placeholder="New PIN" style={{...S.input,flex:1,textAlign:'center'}}/>
            <button onClick={savePinFromEdit} style={S.btnGlass}>Set</button>
          </div>
        </div>
        {profiles.length > 1 && (
          <div style={{marginTop:'4px',width:'100%',textAlign:'center'}}>
            {confirmDelete
              ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px'}}>
                  <p style={{color:'#ff6b6b',fontSize:'13px',margin:0}}>Delete "{editing.name}"? This removes all watch history for this profile.</p>
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={()=>setConfirmDelete(false)} style={S.btnGlass}>Keep It</button>
                    <button onClick={deleteProfile} style={S.btnDanger}>Yes, Delete</button>
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

  if (pinTarget) return (
    <div style={S.wrap}>
      <div style={{width:'96px',height:'96px',borderRadius:'50%',display:'grid',placeItems:'center',background:`linear-gradient(150deg, ${gradFor(pinTarget.id)[0]}, ${gradFor(pinTarget.id)[1]})`,fontSize:'48px',marginBottom:'20px'}}>{pinTarget.avatar}</div>
      <h1 style={{fontSize:'21px',fontWeight:700,marginBottom:'4px',color:'#fff'}}>{pinTarget.name}</h1>
      <p style={{fontSize:'13px',color:'rgba(255,255,255,.45)',margin:'0 0 28px'}}>Enter PIN to continue</p>
      <input autoFocus type="password" inputMode="numeric" maxLength={8}
        value={pinInput} onChange={e=>{setPinInput(e.target.value);setPinError(false);}}
        onKeyDown={e=>e.key==='Enter'&&submitPin()}
        placeholder="••••"
        style={{...S.input, maxWidth:'200px', textAlign:'center', fontSize:'24px', letterSpacing:'.3em'}}/>
      {pinError && <p style={{color:'#ff6b6b',fontSize:'13px',margin:'8px 0 0'}}>Incorrect PIN</p>}
      <div style={{display:'flex',gap:'12px',marginTop:'22px'}}>
        <button onClick={()=>setPinTarget(null)} style={S.btnGlass}>Back</button>
        <button onClick={submitPin} style={S.btnPrimary}>Unlock</button>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.kicker}>HALO</div>
      <h1 style={S.title}>{manageMode ? 'Manage Profiles' : "Who's watching?"}</h1>
      <div style={{display:'flex',flexWrap:'wrap',gap:'20px 36px',justifyContent:'center',maxWidth:'840px',padding:'12px'}}>
        {profiles.map(p => {
          const hov = hoveredId === p.id;
          return (
            <div key={p.id} style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',width:'148px'}}
              onMouseEnter={()=>setHoveredId(p.id)} onMouseLeave={()=>setHoveredId(null)}>
              <button style={S.circle(p.id, hov, manageMode)} onClick={()=>selectProfile(p)} aria-label={p.name}>
                <span style={{fontSize:'60px',lineHeight:1,filter:'drop-shadow(0 4px 10px rgba(0,0,0,.35))'}}>{p.avatar}</span>
              </button>
              <span style={S.name(hov)}>{p.name}</span>
              {manageMode && (
                <button onClick={e=>openEdit(p,e)} aria-label={`Edit ${p.name}`}
                  style={{position:'absolute',top:'50px',left:'50%',transform:'translateX(-50%)',width:'40px',height:'40px',borderRadius:'50%',background:'rgba(10,11,14,.92)',border:'1.5px solid rgba(255,255,255,.4)',color:'#fff',display:'grid',placeItems:'center',cursor:'pointer',padding:0,zIndex:2}}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
        {!manageMode && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',width:'148px'}}
            onMouseEnter={()=>setHoveredId('add')} onMouseLeave={()=>setHoveredId(null)}>
            <button style={S.circleAdd(hoveredId==='add')}
              onClick={()=>{ setFormName(''); setFormAvatar('🦊'); setMode('add'); }} aria-label="Add profile">
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none"
                stroke={hoveredId==='add' ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.4)'}
                strokeWidth="1.6" strokeLinecap="round" style={{transition:'stroke .15s'}}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <span style={S.name(hoveredId==='add')}>Add Profile</span>
          </div>
        )}
      </div>
      <button onClick={()=>setManageMode(v=>!v)}
        style={{marginTop:'52px',background:'none',border:`1px solid rgba(255,255,255,${manageMode?'.7':'.28'})`,borderRadius:'8px',padding:'11px 28px',color:manageMode?'#fff':'rgba(255,255,255,.55)',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',letterSpacing:'.02em',transition:'color .15s, border-color .15s'}}
        onMouseEnter={e=>{e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='rgba(255,255,255,.7)';}}
        onMouseLeave={e=>{if(!manageMode){e.currentTarget.style.color='rgba(255,255,255,.55)';e.currentTarget.style.borderColor='rgba(255,255,255,.28)';}}}>
        {manageMode ? 'Done' : 'Manage Profiles'}
      </button>
      {onClose && !manageMode && (
        <button onClick={onClose}
          style={{marginTop:'16px',background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',transition:'color .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,255,255,.7)';}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,.35)';}}>
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
  tr:     { layout: 'portrait',  tabs: ['home'],                    label: "What's Hot" },
  top10:  { layout: 'top10',     tabs: ['home'],                    label: 'Top 10 in the US Today' },
  rec:    { layout: 'portrait',  tabs: ['home'],                    label: 'Recommended For You' },
  coming: { layout: 'portrait',  tabs: ['home'],                    label: 'Coming Soon' },
  mv:     { layout: 'landscape', tabs: ['home', 'movies'],          label: 'Popular Movies' },
  tv:     { layout: 'landscape', tabs: ['home', 'series'],          label: 'TV Shows' },
  an:     { layout: 'landscape', tabs: ['home', 'anime'],           label: 'Anime' },
  cont:   { layout: 'continue',  tabs: ['home', 'movies', 'series'],label: 'Continue Watching' },
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
  const [recsRow, setRecsRow] = React.useState(null);

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

  /* ── Real-Debrid expiry warning ──── */
  const [rdWarning, setRdWarning] = React.useState(null);
  React.useEffect(() => {
    fetch(`${window.API_BASE_URL}/rd-status`)
      .then(r => r.json())
      .then(d => {
        if (!d.enabled || d.premium === null) return;
        if (!d.premium) { setRdWarning('expired'); return; }
        if (d.days_left <= 5) setRdWarning(`${d.days_left}`);
      })
      .catch(() => {});
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

  /* ── "Because you watched X" lazy row ──── */
  React.useEffect(() => {
    if (!dataLoaded || contItems.length === 0) return;
    const ref = contItems[0];
    if (!ref?.id) return;
    const [type, id] = ref.id.split('_');
    fetch(`${window.API_BASE_URL}/recommendations/${type}/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data?.length) return;
        d.data.forEach(item => { ITEMS[item.id] = item; });
        setRecsRow({
          id: 'becauseOf',
          label: `Because You Watched: ${ref.title}`,
          layout: 'portrait',
          items: d.data.map(i => i.id),
        });
      })
      .catch(() => {});
  }, [dataLoaded, contItems.length]);

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
        <div id="bg" ref={bgRef} style={{display:'none'}}/>
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
      {rdWarning && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:9999,
          background: rdWarning === 'expired' ? '#c0392b' : '#e67e22',
          color:'#fff', textAlign:'center', padding:'10px 16px',
          fontSize:'14px', fontWeight:600, letterSpacing:'.02em',
        }}>
          {rdWarning === 'expired'
            ? '⚠️ Real-Debrid subscription expired — streams unavailable. Renew at real-debrid.com'
            : `⚠️ Real-Debrid expires in ${rdWarning} day${rdWarning === '1' ? '' : 's'} — renew at real-debrid.com`
          }
          <button onClick={() => setRdWarning(null)} style={{
            marginLeft:16, background:'none', border:'1px solid rgba(255,255,255,.5)',
            color:'#fff', borderRadius:4, padding:'2px 10px', cursor:'pointer', fontSize:12,
          }}>Dismiss</button>
        </div>
      )}
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
              {tab === 'home' && recsRow && <Row key="recs" row={recsRow} onOpen={openItem}/>}
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

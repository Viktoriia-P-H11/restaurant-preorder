import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const babelCode = fs.readFileSync(path.join(rootDir, 'tests', 'babel.min.js'), 'utf8');
const vm = require('vm');
const sandbox = { console, process, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel;

let jsx = fs.readFileSync(path.join(rootDir, 'tests', 'extracted.jsx'), 'utf8');

// 1. Fix JSX syntax errors for arrows
jsx = jsx.replaceAll('Appetizers -> Salads -> Mains -> Dessert', 'Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert');
jsx = jsx.replaceAll('Progressive course pacing (Appetizers -> Salads -> Mains -> Dessert)', 'Progressive course pacing (Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert)');

// 2. Add currentUser state and localStorage sync
const userStateTarget = `      // Auth Modal
      const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
      const [authTab, setAuthTab] = useState('signin');
      const [authForm, setAuthForm] = useState({
        name: 'Jasmine Smith',
        email: 'jasmine.smith@example.com',
        password: '',
        confirmPassword: ''
      });`;

const userStateReplacement = `      // Current Logged-in User State (Persistent)
      const [currentUser, setCurrentUser] = useState(() => {
        try {
          const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('gt_user') : null;
          return saved ? JSON.parse(saved) : { id: 'usr-1', name: 'Viktoriia', email: 'viktoriia@example.com', role: 'Owner' };
        } catch {
          return { id: 'usr-1', name: 'Viktoriia', email: 'viktoriia@example.com', role: 'Owner' };
        }
      });
      const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

      // Auth Modal
      const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
      const [authTab, setAuthTab] = useState('signin');
      const [authForm, setAuthForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });`;

if (jsx.includes(userStateTarget)) {
  jsx = jsx.replace(userStateTarget, userStateReplacement);
  console.log("Replaced userState in JSX");
} else {
  console.warn("Could not find userStateTarget!");
}

// 3. Make participants Owner name reflect currentUser
const participantsTarget = `      const [ownerSessionId] = useState("owner-session-123");
      const [participants, setParticipants] = useState([
        {
          id: "owner-session-123",
          type: "Owner",
          name: "Walter",`;

const participantsReplacement = `      const [ownerSessionId] = useState("owner-session-123");
      const [participants, setParticipants] = useState([
        {
          id: "owner-session-123",
          type: "Owner",
          name: (typeof localStorage !== 'undefined' && localStorage.getItem('gt_user')) ? JSON.parse(localStorage.getItem('gt_user')).name : "Viktoriia",`;

if (jsx.includes(participantsTarget)) {
  jsx = jsx.replace(participantsTarget, participantsReplacement);
  console.log("Replaced participantsTarget in JSX");
} else {
  console.warn("Could not find participantsTarget!");
}

// 4. Update Header Profile Button to show currentUser or Sign In/Register
const headerUserTarget = `              <button
                onClick={() => setIsAuthModalOpen(true)}
                title="Account &amp; Sign In"
                class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 transition text-xs font-semibold text-gray-700"
              >
                <div class="w-7 h-7 rounded-full bg-[#18633B] text-white flex items-center justify-center font-bold text-xs">
                  JS
                </div>
                <span class="hidden lg:inline">Jasmine Smith</span>
              </button>`;

const headerUserReplacement = `              {currentUser ? (
                <div class="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title="Account &amp; Profile"
                    class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-semibold text-gray-800"
                  >
                    <div class="w-7 h-7 rounded-full bg-[#18633B] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {currentUser.name ? currentUser.name.charAt(0) : "V"}
                    </div>
                    <span class="font-bold text-gray-900">{currentUser.name}</span>
                    <span class="text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded-full border border-emerald-200 font-bold">{currentUser.role || 'Owner'}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 text-xs space-y-1">
                      <div class="px-3 py-2 border-b border-gray-100">
                        <div class="font-bold text-gray-900">{currentUser.name}</div>
                        <div class="text-[11px] text-gray-500 truncate">{currentUser.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newName = prompt("Enter your new display name:", currentUser.name);
                          if (newName && newName.trim()) {
                            const updated = { ...currentUser, name: newName.trim() };
                            setCurrentUser(updated);
                            try { localStorage.setItem('gt_user', JSON.stringify(updated)); } catch {}
                            setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: updated.name } : p));
                            setReservationDetails(prev => ({ ...prev, hostName: updated.name }));
                            showToast(\`Name updated to \${updated.name}\`);
                          }
                          setIsUserMenuOpen(false);
                        }}
                        class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-xl font-medium text-gray-700"
                      >
                        Edit Display Name
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); setIsAuthModalOpen(true); setAuthTab('signin'); }}
                        class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-xl font-medium text-gray-700"
                      >
                        Switch Account
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setCurrentUser(null);
                          try { localStorage.removeItem('gt_user'); } catch {}
                          showToast("Signed out successfully");
                        }}
                        class="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl font-bold"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div class="flex items-center gap-2">
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setAuthTab('signin'); }}
                    class="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-xl transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setAuthTab('signup'); }}
                    class="bg-[#18633B] hover:bg-[#124B2D] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs"
                  >
                    Register
                  </button>
                </div>
              )}`;

if (jsx.includes(headerUserTarget)) {
  jsx = jsx.replace(headerUserTarget, headerUserReplacement);
  console.log("Replaced headerUserTarget in JSX");
} else {
  console.warn("Could not find headerUserTarget!");
}

// 5. Connect Auth Modal actions to state
const authModalTarget = `                    <button
                      onClick={() => {
                        setIsAuthModalOpen(false);
                        showToast(\`Signed in as \${authForm.email}\`);
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Sign In
                    </button>`;

const authModalReplacement = `                    <button
                      onClick={() => {
                        const user = {
                          id: "usr-" + Date.now(),
                          name: authForm.name || (authForm.email ? authForm.email.split('@')[0] : "Viktoriia"),
                          email: authForm.email || "viktoriia@example.com",
                          role: "Owner"
                        };
                        setCurrentUser(user);
                        try {
                          localStorage.setItem('gt_user', JSON.stringify(user));
                          fetch(\`\${API_BASE}/auth/login\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(user)
                          }).catch(() => {});
                        } catch {}
                        setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: user.name } : p));
                        setReservationDetails(prev => ({ ...prev, hostName: user.name }));
                        setIsAuthModalOpen(false);
                        showToast(\`Welcome back, \${user.name}!\`);
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Sign In
                    </button>

                    <div class="pt-3 border-t border-gray-100">
                      <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">Fast 1-Click Demo Profiles:</div>
                      <div class="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const u = { id: "usr-1", name: "Viktoriia", email: "viktoriia@example.com", role: "Owner" };
                            setCurrentUser(u);
                            try { localStorage.setItem('gt_user', JSON.stringify(u)); } catch {}
                            setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: u.name } : p));
                            setReservationDetails(prev => ({ ...prev, hostName: u.name }));
                            setIsAuthModalOpen(false);
                            showToast("Logged in as Viktoriia (Owner)");
                          }}
                          class="bg-emerald-50 hover:bg-emerald-100 text-[#18633B] border border-emerald-200 p-2 rounded-xl text-left font-bold text-[11px] transition"
                        >
                          Viktoriia (Owner)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = { id: "usr-2", name: "Andrii", email: "andrii@example.com", role: "Guest" };
                            setCurrentUser(u);
                            try { localStorage.setItem('gt_user', JSON.stringify(u)); } catch {}
                            setIsAuthModalOpen(false);
                            showToast("Logged in as Andrii (Guest)");
                          }}
                          class="bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 p-2 rounded-xl text-left font-bold text-[11px] transition"
                        >
                          Andrii (Guest)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = { id: "usr-3", name: "Olena", email: "olena@example.com", role: "Guest" };
                            setCurrentUser(u);
                            try { localStorage.setItem('gt_user', JSON.stringify(u)); } catch {}
                            setIsAuthModalOpen(false);
                            showToast("Logged in as Olena (Guest)");
                          }}
                          class="bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 p-2 rounded-xl text-left font-bold text-[11px] transition"
                        >
                          Olena (Guest)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = { id: "usr-4", name: "Alex Waiter", email: "alex@restaurant.com", role: "Waiter" };
                            setCurrentUser(u);
                            try { localStorage.setItem('gt_user', JSON.stringify(u)); } catch {}
                            setIsAuthModalOpen(false);
                            setActivePage('waiter-flow');
                            showToast("Logged in as Alex (Waiter)");
                          }}
                          class="bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 p-2 rounded-xl text-left font-bold text-[11px] transition"
                        >
                          Alex (Waiter)
                        </button>
                      </div>
                    </div>`;

if (jsx.includes(authModalTarget)) {
  jsx = jsx.replace(authModalTarget, authModalReplacement);
  console.log("Replaced authModalTarget in JSX");
} else {
  console.warn("Could not find authModalTarget!");
}

// 6. Connect Create Account button
const registerModalTarget = `                    <button
                      onClick={() => {
                        setIsAuthModalOpen(false);
                        showToast(\`Account created for \${authForm.name}\`);
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Create Account
                    </button>`;

const registerModalReplacement = `                    <button
                      onClick={() => {
                        const name = authForm.name.trim() || "Viktoriia";
                        const email = authForm.email.trim() || "viktoriia@example.com";
                        const newUser = {
                          id: "usr-" + Date.now(),
                          name: name,
                          email: email,
                          role: "Owner"
                        };
                        setCurrentUser(newUser);
                        try {
                          localStorage.setItem('gt_user', JSON.stringify(newUser));
                          fetch(\`\${API_BASE}/auth/register\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newUser)
                          }).catch(() => {});
                        } catch {}
                        setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: newUser.name } : p));
                        setReservationDetails(prev => ({ ...prev, hostName: newUser.name }));
                        setIsAuthModalOpen(false);
                        showToast(\`Account created! Welcome, \${newUser.name}!\`);
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Create Account &amp; Sign In
                    </button>`;

if (jsx.includes(registerModalTarget)) {
  jsx = jsx.replace(registerModalTarget, registerModalReplacement);
  console.log("Replaced registerModalTarget in JSX");
} else {
  console.warn("Could not find registerModalTarget!");
}

// 7. Connect Book a Table button with Party Size logic
const bookButtonTarget = `                  <button
                    onClick={() => {
                      const times = bookForm.selectedTimeSlot.split(' - ');
                      setReservationDetails(prev => ({
                        ...prev,
                        location: bookForm.location,
                        date: bookForm.date,
                        occasion: bookForm.occasion || "Dinner Reservation",
                        startTime: times[0] || "18:30",
                        endTime: times[1] || "21:30"
                      }));
                      setBookSuccessModal(true);
                    }}
                    class="w-full sm:w-auto bg-[#18633B] hover:bg-[#124B2D] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-sm transition"
                  >
                    Confirm &amp; Generate Table Link &rarr;
                  </button>`;

const bookButtonReplacement = `                  <button
                    onClick={() => {
                      const times = bookForm.selectedTimeSlot.split(' - ');
                      const isSingle = bookForm.partySize.includes('2') === false && bookForm.partySize.includes('1 Guest');
                      const host = currentUser ? currentUser.name : "Viktoriia";
                      const newRes = {
                        reservationId: "res-" + Math.floor(1000 + Math.random() * 9000),
                        tableName: \`Table #\${Math.floor(1 + Math.random() * 10)} (\${bookForm.partySize})\`,
                        location: bookForm.location,
                        date: bookForm.date,
                        occasion: bookForm.occasion || "Dinner Reservation",
                        startTime: times[0] || "18:30",
                        endTime: times[1] || "21:30",
                        partySize: bookForm.partySize,
                        hostName: host,
                        status: "Active"
                      };
                      setReservationDetails(prev => ({
                        ...prev,
                        ...newRes
                      }));
                      try {
                        fetch(\`\${API_BASE}/reservations\`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newRes)
                        }).catch(() => {});
                      } catch {}
                      setBookSuccessModal(true);
                      showToast("Reservation saved successfully!");
                    }}
                    class="w-full sm:w-auto bg-[#18633B] hover:bg-[#124B2D] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-sm transition"
                  >
                    Confirm &amp; Reserve Table &rarr;
                  </button>`;

if (jsx.includes(bookButtonTarget)) {
  jsx = jsx.replace(bookButtonTarget, bookButtonReplacement);
  console.log("Replaced bookButtonTarget in JSX");
} else {
  console.warn("Could not find bookButtonTarget!");
}

// 8. In Book Success Modal: smart routing based on partySize
const bookSuccessModalTarget = `                    <div class="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setBookSuccessModal(false);
                          setActivePage('group-order');
                          setCurrentRole('host');
                          showToast("Welcome to your Table Pre-Order review");
                        }}
                        class="w-full py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl text-xs transition shadow-sm"
                      >
                        Open Group Pre-Order &rarr;
                      </button>
                      <button
                        onClick={() => {
                          setBookSuccessModal(false);
                          setActivePage('reservations');
                        }}
                        class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        View in Reservations List
                      </button>
                    </div>`;

const bookSuccessModalReplacement = `                    <div class="pt-2 flex flex-col gap-2">
                      {bookForm.partySize.includes('1 Guest') ? (
                        <button
                          onClick={() => {
                            setBookSuccessModal(false);
                            setActivePage('guest-flow');
                            setCurrentRole('guest');
                            showToast("Opening Individual Pre-Order");
                          }}
                          class="w-full py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl text-xs transition shadow-sm"
                        >
                          Go to My Pre-Order (Individual) &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setBookSuccessModal(false);
                            setActivePage('group-order');
                            setCurrentRole('host');
                            showToast("Opening Group Pre-Order review");
                          }}
                          class="w-full py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl text-xs transition shadow-sm"
                        >
                          Open Group Pre-Order (Table Host) &rarr;
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setBookSuccessModal(false);
                          setActivePage('reservations');
                        }}
                        class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        View in Reservations List
                      </button>
                    </div>`;

if (jsx.includes(bookSuccessModalTarget)) {
  jsx = jsx.replace(bookSuccessModalTarget, bookSuccessModalReplacement);
  console.log("Replaced bookSuccessModalTarget in JSX");
} else {
  console.warn("Could not find bookSuccessModalTarget!");
}

// 9. Owner Card: Allow editing name & adding dishes to Owner's cart
const ownerTitleTarget = `                                <div class="flex items-center gap-2">
                                  <h2 class="font-bold text-sm text-gray-900">
                                    {isOwner ? "My Pre-Order" : \`Guest: \${person.name}\`}
                                  </h2>
                                  {isOwner && (
                                    <span class="text-[10px] font-bold text-[#18633B] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                                      Host
                                    </span>
                                  )}
                                </div>`;

const ownerTitleReplacement = `                                <div class="flex items-center gap-2 flex-wrap">
                                  <h2 class="font-bold text-sm text-gray-900">
                                    {isOwner ? \`My Pre-Order (\${person.name || (currentUser ? currentUser.name : 'Owner')})\` : \`Guest: \${person.name}\`}
                                  </h2>
                                  {isOwner && (
                                    <>
                                      <span class="text-[10px] font-bold text-[#18633B] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                                        Host
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newName = prompt("Edit your host name:", person.name);
                                          if (newName && newName.trim()) {
                                            setParticipants(prev => prev.map(p => p.id === person.id ? { ...p, name: newName.trim() } : p));
                                            if (currentUser) {
                                              const updated = { ...currentUser, name: newName.trim() };
                                              setCurrentUser(updated);
                                              try { localStorage.setItem('gt_user', JSON.stringify(updated)); } catch {}
                                            }
                                            showToast(\`Host name changed to \${newName.trim()}\`);
                                          }
                                        }}
                                        title="Edit Owner Name"
                                        class="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline ml-1"
                                      >
                                        Edit
                                      </button>
                                    </>
                                  )}
                                </div>`;

if (jsx.includes(ownerTitleTarget)) {
  jsx = jsx.replace(ownerTitleTarget, ownerTitleReplacement);
  console.log("Replaced ownerTitleTarget in JSX");
} else {
  console.warn("Could not find ownerTitleTarget!");
}

// 10. Add Dish to Owner Cart and Add Guest to Table button
const addGuestTarget = `                  {/* PARTICIPANTS LIST */}
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Participants ({participants.length})</span>
                      <span>{consolidation.submittedCount} Ready</span>
                    </div>`;

const addGuestReplacement = `                  {/* PARTICIPANTS LIST */}
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Participants ({participants.length})</span>
                      <div class="flex items-center gap-2">
                        <span>{consolidation.submittedCount} Ready</span>
                        {groupStatus === "Open" && (
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt("Enter new guest name (e.g. Oksana):");
                              if (name && name.trim()) {
                                const newGuest = {
                                  id: "session-" + Date.now(),
                                  type: "Guest",
                                  name: name.trim(),
                                  items: [],
                                  total: 0,
                                  isSubmitted: false
                                };
                                setParticipants(prev => [...prev, newGuest]);
                                showToast(\`Added \${name.trim()} to the table\`);
                              }
                            }}
                            class="bg-[#18633B] hover:bg-[#124B2D] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                          >
                            + Add Guest
                          </button>
                        )}
                      </div>
                    </div>`;

if (jsx.includes(addGuestTarget)) {
  jsx = jsx.replace(addGuestTarget, addGuestReplacement);
  console.log("Replaced addGuestTarget in JSX");
} else {
  console.warn("Could not find addGuestTarget!");
}

// Save updated JSX
fs.writeFileSync(path.join(rootDir, 'tests', 'extracted.jsx'), jsx, 'utf8');

// Transpile with Babel
console.log("Transpiling with Babel...");
const transpiled = Babel.transform(jsx, {
  presets: [
    ['react', { runtime: 'classic' }]
  ]
});
console.log("Transpilation successful! Output code size:", transpiled.code.length);

const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Green &amp; Tasty - Multi-Role Restaurant &amp; Pre-Order Platform</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React 18 & ReactDOM Production -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <!-- Font Poppins / Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Poppins', 'Plus Jakarta Sans', sans-serif; background-color: #FAF9F6; }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen text-gray-900 flex flex-col">

  <!-- React Root Container -->
  <div id="root" class="w-full flex-1 flex flex-col"></div>

  <!-- Pre-compiled Pure React 18 Script (Instant Load, Zero Babel Overhead) -->
  <script>
${transpiled.code}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'frontend', 'index.html'), finalHtml, 'utf8');
fs.writeFileSync(path.join(rootDir, 'backend', 'index.html'), finalHtml, 'utf8');
console.log("Updated frontend/index.html and backend/index.html successfully!");

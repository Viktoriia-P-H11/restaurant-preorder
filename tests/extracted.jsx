
    const { useState, useEffect, useMemo } = React;

    const API_BASE = window.location.origin.includes('amazonaws.com')
      ? window.location.origin
      : "https://8191ergrtg.execute-api.us-west-2.amazonaws.com";

    // Level 2 Consolidation Algorithm
    function consolidatePreOrder(participants) {
      if (!Array.isArray(participants)) return { dishes: [], grandTotal: 0, submittedCount: 0, unsubmittedCount: 0 };
      const submitted = participants.filter(p => p.isSubmitted === true);
      const dishMap = new Map();
      let grandTotal = 0;

      for (const person of submitted) {
        for (const item of person.items || []) {
          const dishId = item.dish?.id || item.dishId;
          const name = item.dish?.name || item.name || dishId;
          const price = item.dish?.price || 0;
          const qty = item.quantity || 0;
          grandTotal += price * qty;

          if (dishMap.has(dishId)) {
            const existing = dishMap.get(dishId);
            existing.quantity += qty;
            existing.total += price * qty;
          } else {
            dishMap.set(dishId, { dishId, name, price, quantity: qty, total: price * qty });
          }
        }
      }

      return {
        dishes: Array.from(dishMap.values()),
        grandTotal,
        submittedCount: submitted.length,
        unsubmittedCount: participants.length - submitted.length
      };
    }

    function App() {
      // ----------------------------------------------------
      // CURRENT ACTIVE ROLE SWITCHER FOR FULL TESTING
      // Roles: 'host' (Owner) | 'guest' (Table Guest) | 'waiter' (Staff) | 'kitchen' (Chef)
      // ----------------------------------------------------
      const [currentRole, setCurrentRole] = useState('host');

      // Navigation Tab: 'main' | 'book' | 'reservations' | 'group-order' | 'guest-flow' | 'waiter-flow' | 'kitchen-flow'
      const [activePage, setActivePage] = useState('main');

      // Toast Notification
      const [toast, setToast] = useState({ show: false, text: "" });
      const showToast = (text) => {
        setToast({ show: true, text });
        setTimeout(() => setToast({ show: false, text: "" }), 3500);
      };

      // Real live URL for sharing
      const shareUrl = typeof window !== 'undefined' && window.location.href.startsWith('http')
        ? window.location.href.split('?')[0]
        : "https://8191ergrtg.execute-api.us-west-2.amazonaws.com/";

      // ----------------------------------------------------
      // MASTER RESERVATION & TABLE DETAILS (Synced across all roles)
      // ----------------------------------------------------
      const [reservationDetails, setReservationDetails] = useState({
        reservationId: "res-8492",
        tableName: "Table #4 (Indoor Lounge) • 6 Seats",
        tableNumber: "4",
        occasion: "Birthday Celebration",
        location: "Main Dining Hall, 140 Rockwell Avenue",
        date: "2026-10-31",
        startTime: "18:30",
        endTime: "21:30",
        guestCount: 5,
        hostName: "Walter",
        servingSchedule: "Serve starters upon arrival (18:30), mains at 19:15",
        specialRequests: "Please arrange festive napkins. Oleg K. has a severe nut allergy."
      });

      // Status of group order: "Open" | "Sent to Restaurant" | "In Progress" | "Confirmed by Restaurant" | "Rejected"
      const [groupStatus, setGroupStatus] = useState("Open");

      // ----------------------------------------------------
      // PARTICIPANTS STATE
      // ----------------------------------------------------
      const [ownerSessionId] = useState("owner-session-123");
      const [participants, setParticipants] = useState([
        {
          id: "owner-session-123",
          type: "Owner",
          name: (typeof localStorage !== 'undefined' && localStorage.getItem('gt_user')) ? JSON.parse(localStorage.getItem('gt_user')).name : "Viktoriia",
          items: [
            { dish: { id: "dish1", name: "Caesar Salad", price: 180 }, quantity: 1 }
          ],
          total: 180,
          isSubmitted: true
        },
        {
          id: "session1",
          type: "Guest",
          name: "Andrii",
          items: [
            { dish: { id: "dish1", name: "Caesar Salad", price: 180 }, quantity: 2 }
          ],
          total: 360,
          isSubmitted: true
        },
        {
          id: "session2",
          type: "Guest",
          name: "Olena",
          items: [
            { dish: { id: "dish2", name: "Tom Yum", price: 220 }, quantity: 1 }
          ],
          total: 220,
          isSubmitted: false
        },
        {
          id: "session3",
          type: "Guest",
          name: "Alex",
          items: [],
          total: 0,
          isSubmitted: false
        }
      ]);

      const consolidation = useMemo(() => consolidatePreOrder(participants), [participants]);

      // Payment Mode: 'host' (Host Covers All) | 'split_equal' (Split Bill Evenly) | 'split_custom' (Pay Per Individual Selection)
      const [paymentMode, setPaymentMode] = useState('host');

      // Dietary & Allergy notes per participant
      const [guestDietaryNotes, setGuestDietaryNotes] = useState({
        "owner-session-123": "Dressing on the side, no heavy garlic",
        "session1": "Vegetarian only; Caesar salad without anchovies",
        "session2": "Severe nut allergy (walnuts / peanuts)",
        "session3": "No dietary restrictions"
      });

      // ----------------------------------------------------
      // GUEST ACTOR STATE (For Guest Pre-Order simulation)
      // ----------------------------------------------------
      const [activeGuestId, setActiveGuestId] = useState("session2"); // Defaults to Olena
      const activeGuest = useMemo(() => {
        return participants.find(p => p.id === activeGuestId) || participants[1];
      }, [participants, activeGuestId]);

      // ----------------------------------------------------
      // BOOK A TABLE INTERACTIVE STATE
      // ----------------------------------------------------
      const [bookForm, setBookForm] = useState({
        location: "48 Rustaveli Avenue (Main Dining Hall)",
        date: "2026-10-31",
        partySize: "5 Guests (Group Reservation)",
        selectedTimeSlot: "18:30 - 21:30",
        occasion: "Birthday Celebration",
        specialRequests: "Birthday celebration for 5 guests with shared pre-order"
      });

      const [bookSuccessModal, setBookSuccessModal] = useState(false);

      // Available Book Slots
      const availableTimeSlots = [
        "12:00 - 14:00",
        "18:30 - 21:30",
        "19:00 - 22:00",
        "20:00 - 23:00"
      ];

      // ----------------------------------------------------
      // MODALS: Submit, Remove Guest, Edit Reservation, Share
      // ----------------------------------------------------
      const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
      const [removeGuestModal, setRemoveGuestModal] = useState({ isOpen: false, guest: null });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [editForm, setEditForm] = useState({ ...reservationDetails });
      const [showShareBox, setShowShareBox] = useState(false);

      const [shareModal, setShareModal] = useState({
        isOpen: false,
        channel: 'email',
        recipient: '',
        guestName: ''
      });

      const openShareModal = (channel, defaultRecipient = '', guestName = '') => {
        setShareModal({
          isOpen: true,
          channel,
          recipient: defaultRecipient,
          guestName
        });
      };

      const [editNoteModal, setEditNoteModal] = useState({
        isOpen: false,
        guestId: null,
        guestName: "",
        note: ""
      });

      const openEditNoteModal = (person) => {
        setEditNoteModal({
          isOpen: true,
          guestId: person.id,
          guestName: person.name,
          note: guestDietaryNotes[person.id] || ""
        });
      };

      // 3-Hour Cancellation Modal
      const [cancelDishModal, setCancelDishModal] = useState({
        isOpen: false,
        guestId: null,
        guestName: ""
      });

      // Waiter Review Modal (Inspector)
      const [waiterInspectModal, setWaiterInspectModal] = useState(false);

      // Current Logged-in User State (Persistent)
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
      });

      // Selected Dish Modal (Menu details)
      const [selectedDishModal, setSelectedDishModal] = useState(null);
      const [dishModalQty, setDishModalQty] = useState(1);

      // Reservations View toggle (Active vs Figma Empty State)
      const [reservationsView, setReservationsView] = useState('active');

      // ----------------------------------------------------
      // BACKGROUND SYNC (Level 3 - 15 Seconds)
      // ----------------------------------------------------
      const [lastSyncTime, setLastSyncTime] = useState(new Date());
      const [syncError, setSyncError] = useState(null);
      const [isSyncing, setIsSyncing] = useState(false);

      const syncData = async (silent = true) => {
        if (groupStatus === "Submitted" || groupStatus === "Confirmed by Restaurant") return;
        if (!silent) setIsSyncing(true);
        try {
          const res = await fetch(`${API_BASE}/guest/groups/group1/sessions`, {
            headers: { 'Role': 'Owner' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.participants && Array.isArray(data.participants)) {
              setParticipants(prev => {
                const owner = prev.find(p => p.type === 'Owner');
                return owner ? [owner, ...data.participants] : data.participants;
              });
            }
            setLastSyncTime(new Date());
            setSyncError(null);
            if (!silent) showToast("Group pre-order data synced with cloud");
          }
        } catch {
          setSyncError("Couldn't refresh. Showing data from " + lastSyncTime.toLocaleTimeString());
        } finally {
          if (!silent) setIsSyncing(false);
        }
      };

      useEffect(() => {
        if (groupStatus === "Submitted" || groupStatus === "Confirmed by Restaurant") return;
        const timer = setInterval(() => syncData(true), 15000);
        return () => clearInterval(timer);
      }, [groupStatus, lastSyncTime]);

      // Confirm Submit Pre-Order
      const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
          await fetch(`${API_BASE}/group-reservations/group1/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Role': 'Owner' },
            body: JSON.stringify({ reservationId: reservationDetails.reservationId })
          });
        } catch {}
        setGroupStatus("Sent to Restaurant");
        setIsSubmitModalOpen(false);
        setIsSubmitting(false);
        showToast("Pre-order sent to restaurant! Waiter notified for approval.");
      };

      // Confirm Remove Guest
      const handleConfirmRemove = async () => {
        if (!removeGuestModal.guest) return;
        const guestId = removeGuestModal.guest.id;
        const guestName = removeGuestModal.guest.name;
        try {
          await fetch(`${API_BASE}/guest/groups/group1/sessions/${guestId}`, {
            method: 'DELETE',
            headers: { 'Role': 'Owner' }
          });
        } catch {}
        setParticipants(prev => prev.filter(p => p.id !== guestId));
        setRemoveGuestModal({ isOpen: false, guest: null });
        showToast(`${guestName} and their pre-order were removed`);
      };

      // Cancel Pre-Order (3-Hour Policy Execution)
      const handleCancelGuestPreOrder = (guestId) => {
        setParticipants(prev => prev.map(p => {
          if (p.id === guestId) {
            return { ...p, items: [], total: 0, isSubmitted: false };
          }
          return p;
        }));
        setCancelDishModal({ isOpen: false, guestId: null, guestName: "" });
        showToast("Pre-order cancelled within the 3-hour free cancellation window");
      };

      // ----------------------------------------------------
      // DATA: POPULAR DISHES & MENU
      // ----------------------------------------------------
      const popularDishes = [
        {
          id: "dish1",
          name: "Fresh Strawberry Mint Salad",
          price: 17,
          weight: "430g",
          course: "Starters & Salads",
          image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
          desc: "Fresh strawberries, organic mixed greens, creamy feta cheese, garden mint, and sweet poppy seed dressing.",
          calories: "430 kcal",
          protein: "12.00g",
          fats: "14.00g",
          carbs: "28.00g"
        },
        {
          id: "dish2",
          name: "Roasted Sweet Potato & Lentil",
          price: 10,
          weight: "380g",
          course: "Starters & Salads",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          desc: "Warm roasted sweet potato chunks with black lentils, baby spinach, pomegranate seeds, and tahini drizzle.",
          calories: "380 kcal",
          protein: "14.50g",
          fats: "8.00g",
          carbs: "42.00g"
        },
        {
          id: "dish3",
          name: "Avocado Quinoa Bowl",
          price: 18,
          weight: "410g",
          course: "Main Courses",
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
          desc: "Fluffy tri-color quinoa, ripe Hass avocado, cherry tomatoes, cucumbers, edamame, and herb citrus dressing.",
          calories: "410 kcal",
          protein: "11.00g",
          fats: "19.00g",
          carbs: "34.00g"
        },
        {
          id: "dish4",
          name: "Grilled Salmon with Herbs",
          price: 22,
          weight: "350g",
          course: "Main Courses",
          image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
          desc: "Wild Atlantic salmon fillet pan-seared with fresh rosemary, thyme, garlic butter, and grilled asparagus.",
          calories: "520 kcal",
          protein: "38.00g",
          fats: "26.00g",
          carbs: "4.00g"
        }
      ];

      const locations = [
        {
          id: "loc1",
          name: "48 Rustaveli Avenue",
          rating: "4.9",
          reviewsCount: "128 reviews",
          hours: "Daily 10:00 - 23:00",
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "loc2",
          name: "14 Baratashvili Street",
          rating: "4.8",
          reviewsCount: "94 reviews",
          hours: "Daily 11:00 - 23:00",
          image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "loc3",
          name: "9 Abashidze Street",
          rating: "4.9",
          reviewsCount: "142 reviews",
          hours: "Daily 10:00 - 00:00",
          image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80"
        }
      ];

      const reviews = [
        {
          id: "r1",
          author: "Elena Rostova",
          rating: 5,
          date: "Oct 24, 2026",
          text: "Green & Tasty has become our family favorite! The Georgian salads are amazingly authentic yet light. The group pre-order feature made our birthday dinner totally seamless."
        },
        {
          id: "r2",
          author: "Alex Morgan",
          rating: 5,
          date: "Oct 20, 2026",
          text: "Exceptional atmosphere on Rustaveli Ave. Ordered ahead with friends so all dishes arrived right as we sat down. Roasted Sweet Potato salad is unbelievable!"
        },
        {
          id: "r3",
          author: "David Chen",
          rating: 5,
          date: "Oct 15, 2026",
          text: "Best dining experience in town. High quality ingredients, impeccable service, and the digital table reservation flow worked without a hitch."
        }
      ];

      return (
        <div class="flex-1 flex flex-col bg-[#FAF9F6]">

          {/* Toast Notification */}
          {toast.show && (
            <div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold border border-gray-700 animate-in fade-in duration-200">
              {toast.text}
            </div>
          )}

          {/* ========================================================= */}
          {/* TOP ROLE SWITCHER BAR (Enables testing all 4 viewpoints)   */}
          {/* ========================================================= */}
          <div class="bg-gray-900 text-white text-xs px-4 md:px-8 py-2 flex flex-wrap items-center justify-between border-b border-gray-800">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Testing Role:</span>
              <div class="flex items-center gap-1.5 bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => { setCurrentRole('host'); setActivePage('group-order'); showToast("Switched to Host / Owner View"); }}
                  class={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${currentRole === 'host' ? 'bg-[#18633B] text-white shadow-xs' : 'text-gray-300 hover:text-white'}`}
                >
                  Host (Walter)
                </button>
                <button
                  onClick={() => { setCurrentRole('guest'); setActivePage('guest-flow'); showToast("Switched to Guest View (via invite link)"); }}
                  class={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${currentRole === 'guest' ? 'bg-[#18633B] text-white shadow-xs' : 'text-gray-300 hover:text-white'}`}
                >
                  Guest (Olena)
                </button>
                <button
                  onClick={() => { setCurrentRole('waiter'); setActivePage('waiter-flow'); showToast("Switched to Waiter View (Alex Caper)"); }}
                  class={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${currentRole === 'waiter' ? 'bg-[#18633B] text-white shadow-xs' : 'text-gray-300 hover:text-white'}`}
                >
                  Waiter (Alex Caper)
                </button>
                <button
                  onClick={() => { setCurrentRole('kitchen'); setActivePage('kitchen-flow'); showToast("Switched to Kitchen Display (Chef)"); }}
                  class={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${currentRole === 'kitchen' ? 'bg-[#18633B] text-white shadow-xs' : 'text-gray-300 hover:text-white'}`}
                >
                  Kitchen (Chef)
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3 text-[11px] text-gray-400">
              <span>Status: <strong class="text-emerald-400">{groupStatus}</strong></span>
              <span>Total: <strong class="text-white">${consolidation.grandTotal}.00</strong></span>
            </div>
          </div>

          {/* GLOBAL NAVBAR */}
          <nav class="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
            {/* Logo */}
            <div class="flex items-center gap-2.5 cursor-pointer" onClick={() => setActivePage('main')}>
              <div class="w-8 h-8 rounded-full bg-[#18633B] text-white flex items-center justify-center font-black text-sm">
                G
              </div>
              <span class="font-extrabold text-lg text-gray-900 tracking-tight">Green &amp; Tasty</span>
            </div>

            {/* Navigation Links */}
            <div class="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-gray-600">
              <button
                onClick={() => setActivePage('main')}
                class={`transition pb-1 ${activePage === 'main' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Main page
              </button>
              <button
                onClick={() => setActivePage('book')}
                class={`transition pb-1 ${activePage === 'book' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Book a Table
              </button>
              <button
                onClick={() => setActivePage('reservations')}
                class={`transition pb-1 ${activePage === 'reservations' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Reservations
              </button>
              <button
                onClick={() => { setActivePage('group-order'); setCurrentRole('host'); }}
                class={`transition pb-1 ${activePage === 'group-order' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Group Pre-Order
              </button>
              <button
                onClick={() => { setActivePage('guest-flow'); setCurrentRole('guest'); }}
                class={`transition pb-1 ${activePage === 'guest-flow' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Guest Pre-Order
              </button>
              <button
                onClick={() => { setActivePage('waiter-flow'); setCurrentRole('waiter'); }}
                class={`transition pb-1 ${activePage === 'waiter-flow' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Waiter View
              </button>
              <button
                onClick={() => { setActivePage('kitchen-flow'); setCurrentRole('kitchen'); }}
                class={`transition pb-1 ${activePage === 'kitchen-flow' ? 'text-[#18633B] font-bold border-b-2 border-[#18633B]' : 'hover:text-gray-900'}`}
              >
                Kitchen
              </button>
            </div>

            {/* Right Profile / Sign In */}
            <div class="flex items-center gap-3">
              <button
                onClick={() => setActivePage('group-order')}
                class="hidden sm:inline-flex bg-[#18633B] hover:bg-[#124B2D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
              >
                Group Order (${consolidation.grandTotal})
              </button>

              {currentUser ? (
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
                            showToast(`Name updated to ${updated.name}`);
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
              )}
            </div>
          </nav>

          {/* ========================================================= */}
          {/* AUTH MODAL (Sign In, Create Account, Reset Password)      */}
          {/* ========================================================= */}
          {isAuthModalOpen && (
            <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-5 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 class="font-black text-lg text-gray-900">
                    {authTab === 'signin' && "Sign In to Your Account"}
                    {authTab === 'signup' && "Create an Account"}
                    {authTab === 'reset' && "Reset Your Password"}
                  </h3>
                  <button onClick={() => setIsAuthModalOpen(false)} class="text-gray-400 hover:text-gray-600 font-bold text-sm">X</button>
                </div>

                <div class="flex border-b border-gray-200 text-xs font-bold">
                  <button
                    onClick={() => setAuthTab('signin')}
                    class={`pb-2.5 px-3 transition ${authTab === 'signin' ? 'text-[#18633B] border-b-2 border-[#18633B]' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthTab('signup')}
                    class={`pb-2.5 px-3 transition ${authTab === 'signup' ? 'text-[#18633B] border-b-2 border-[#18633B]' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setAuthTab('reset')}
                    class={`pb-2.5 px-3 transition ${authTab === 'reset' ? 'text-[#18633B] border-b-2 border-[#18633B]' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    Reset Password
                  </button>
                </div>

                {authTab === 'signin' && (
                  <div class="space-y-3.5 text-xs">
                    <div>
                      <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Email:</label>
                      <input
                        type="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="font-bold text-gray-700 uppercase text-[11px]">Password:</label>
                        <button onClick={() => setAuthTab('reset')} class="text-[11px] text-[#18633B] font-semibold hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>

                    <button
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
                          fetch(`${API_BASE}/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(user)
                          }).catch(() => {});
                        } catch {}
                        setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: user.name } : p));
                        setReservationDetails(prev => ({ ...prev, hostName: user.name }));
                        setIsAuthModalOpen(false);
                        showToast(`Welcome back, ${user.name}!`);
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
                    </div>
                  </div>
                )}

                {authTab === 'signup' && (
                  <div class="space-y-3.5 text-xs">
                    <div>
                      <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Full Name:</label>
                      <input
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>
                    <div>
                      <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Email:</label>
                      <input
                        type="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>
                    <div>
                      <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Password:</label>
                      <input
                        type="password"
                        placeholder="Minimum 8 characters"
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>

                    <button
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
                          fetch(`${API_BASE}/auth/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newUser)
                          }).catch(() => {});
                        } catch {}
                        setParticipants(prev => prev.map(p => p.type === 'Owner' ? { ...p, name: newUser.name } : p));
                        setReservationDetails(prev => ({ ...prev, hostName: newUser.name }));
                        setIsAuthModalOpen(false);
                        showToast(`Account created! Welcome, ${newUser.name}!`);
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Create Account &amp; Sign In
                    </button>
                  </div>
                )}

                {authTab === 'reset' && (
                  <div class="space-y-3.5 text-xs">
                    <p class="text-gray-600 text-xs">
                      Enter your email address and 4-digit verification code to recover your account.
                    </p>
                    <div>
                      <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Email Address:</label>
                      <input
                        type="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      />
                    </div>

                    <div>
                      <label class="block font-bold text-gray-700 mb-1.5 uppercase text-[11px]">4-Digit Verification Code:</label>
                      <div class="flex gap-2 justify-center">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength="1"
                            placeholder="•"
                            class="w-12 h-12 text-center text-lg font-bold bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-[#18633B]"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsAuthModalOpen(false);
                        showToast("Password reset code verified");
                      }}
                      class="w-full mt-2 py-3 bg-[#18633B] hover:bg-[#124B2D] text-white font-bold rounded-xl shadow-sm text-xs transition"
                    >
                      Verify &amp; Reset Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 1: MAIN LANDING PAGE                                 */}
          {/* ========================================================= */}
          {activePage === 'main' && (
            <div class="flex-1 space-y-12 pb-16">

              {/* HERO SECTION */}
              <div class="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
                <div class="bg-[#EBF7EE] rounded-3xl p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden border border-[#D4EED8]">
                  <div class="max-w-md space-y-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-[#18633B]">Welcome to Green &amp; Tasty</span>
                    <h1 class="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                      Green by nature,<br/>Georgian by heart.
                    </h1>
                    <p class="text-xs md:text-sm text-gray-600 leading-relaxed">
                      Discover authentic Georgian gastronomy crafted with fresh, organic ingredients. Reserve your table and coordinate shared group pre-orders effortlessly.
                    </p>
                    <div class="pt-2 flex flex-wrap gap-3">
                      <button
                        onClick={() => setActivePage('book')}
                        class="bg-[#18633B] hover:bg-[#124B2D] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-2xl shadow-sm transition"
                      >
                        Book a Table
                      </button>
                      <button
                        onClick={() => { setActivePage('group-order'); setCurrentRole('host'); }}
                        class="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs md:text-sm px-6 py-3 rounded-2xl transition"
                      >
                        Group Pre-Order
                      </button>
                    </div>
                  </div>

                  <div class="w-full md:w-1/2 flex justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80"
                      alt="Salad bowls"
                      class="rounded-3xl shadow-xl w-full max-w-sm md:max-w-md object-cover h-64 md:h-80"
                    />
                  </div>
                </div>
              </div>

              {/* MOST POPULAR DISHES */}
              <div class="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xl md:text-2xl font-black text-gray-900">Most Popular Dishes</h2>
                    <p class="text-xs text-gray-500 mt-0.5">Click any dish to inspect nutrition and portion details</p>
                  </div>
                  <button onClick={() => setActivePage('group-order')} class="text-xs font-bold text-[#18633B] hover:underline">
                    View in Group Cart &rarr;
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {popularDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => { setSelectedDishModal(dish); setDishModalQty(1); }}
                      class="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div class="space-y-3">
                        <div class="overflow-hidden rounded-xl h-44 bg-gray-100">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div>
                          <h3 class="font-bold text-sm text-gray-900 leading-snug group-hover:text-[#18633B] transition">
                            {dish.name}
                          </h3>
                          <p class="text-[11px] text-gray-400 mt-0.5">{dish.weight}</p>
                        </div>
                      </div>

                      <div class="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                        <span class="font-black text-base text-gray-900">${dish.price}.00</span>
                        <span class="text-xs font-bold text-[#18633B] bg-[#ECFDF3] px-3 py-1 rounded-xl border border-[#D1FADF]">
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOCATIONS */}
              <div class="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
                <div>
                  <h2 class="text-xl md:text-2xl font-black text-gray-900">Locations</h2>
                  <p class="text-xs text-gray-500 mt-0.5">Visit us in the heart of the city</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {locations.map((loc) => (
                    <div key={loc.id} class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs flex flex-col">
                      <img src={loc.image} alt={loc.name} class="w-full h-48 object-cover" />
                      <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div class="flex items-center justify-between">
                            <h3 class="font-bold text-sm text-gray-900">{loc.name}</h3>
                            <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              ★ {loc.rating}
                            </span>
                          </div>
                          <p class="text-xs text-gray-400 mt-1">{loc.reviewsCount} &bull; {loc.hours}</p>
                        </div>
                        <button
                          onClick={() => setActivePage('book')}
                          class="w-full text-xs font-bold text-[#18633B] hover:bg-[#ECFDF3] py-2.5 rounded-xl border border-[#18633B] transition"
                        >
                          Book at this location
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOMER REVIEWS */}
              <div class="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
                <div>
                  <h2 class="text-xl md:text-2xl font-black text-gray-900">Customer Reviews</h2>
                  <p class="text-xs text-gray-500 mt-0.5">What our guests say about dining with us</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} class="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-900">{rev.author}</span>
                        <div class="text-amber-500 text-xs font-bold">★★★★★</div>
                      </div>
                      <p class="text-xs text-gray-600 leading-relaxed italic">"{rev.text}"</p>
                      <div class="text-[10px] text-gray-400 border-t border-gray-100 pt-2">{rev.date}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* DISH DETAIL MODAL                                         */}
          {/* ========================================================= */}
          {selectedDishModal && (
            <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 class="font-extrabold text-base text-gray-900">{selectedDishModal.name}</h3>
                  <button onClick={() => setSelectedDishModal(null)} class="text-gray-400 hover:text-gray-600 font-bold text-sm">X</button>
                </div>

                <div class="flex flex-col sm:flex-row gap-4 items-center">
                  <img src={selectedDishModal.image} alt={selectedDishModal.name} class="w-full sm:w-44 h-44 rounded-2xl object-cover" />
                  <div class="space-y-2 text-xs text-gray-600 flex-1">
                    <p class="leading-relaxed">{selectedDishModal.desc}</p>
                    <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] space-y-1">
                      <span class="font-bold text-gray-800 block">Nutrition Information:</span>
                      <div class="text-gray-500">
                        Calories: <span class="font-semibold text-gray-700">{selectedDishModal.calories}</span><br/>
                        Protein: <span class="font-semibold text-gray-700">{selectedDishModal.protein}</span> | Fats: <span class="font-semibold text-gray-700">{selectedDishModal.fats}</span> | Carbs: <span class="font-semibold text-gray-700">{selectedDishModal.carbs}</span>
                      </div>
                    </div>
                    <div class="font-black text-base text-[#18633B] pt-1">
                      ${selectedDishModal.price}.00 <span class="text-xs font-normal text-gray-400">/ {selectedDishModal.weight}</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div class="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button onClick={() => setDishModalQty(Math.max(1, dishModalQty - 1))} class="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold">-</button>
                    <span class="px-4 py-1 text-xs font-bold text-gray-800">{dishModalQty}</span>
                    <button onClick={() => setDishModalQty(dishModalQty + 1)} class="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                  </div>

                  <div class="flex gap-2">
                    <button onClick={() => setSelectedDishModal(null)} class="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button
                      onClick={() => {
                        // Add to current actor's cart
                        const dish = selectedDishModal;
                        const qty = dishModalQty;
                        const targetId = currentRole === 'guest' ? activeGuestId : ownerSessionId;

                        setParticipants(prev => prev.map(p => {
                          if (p.id === targetId) {
                            const currentItems = [...(p.items || [])];
                            const existing = currentItems.find(it => (it.dish?.id || it.dishId) === dish.id);
                            if (existing) {
                              existing.quantity += qty;
                            } else {
                              currentItems.push({ dish, quantity: qty });
                            }
                            const newTotal = currentItems.reduce((acc, it) => acc + (it.dish.price * it.quantity), 0);
                            return { ...p, items: currentItems, total: newTotal, isSubmitted: true };
                          }
                          return p;
                        }));

                        setSelectedDishModal(null);
                        showToast(`Added ${qty} x ${dish.name} to cart`);
                      }}
                      class="px-5 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                    >
                      Add to Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 2: BOOK A TABLE PAGE (Interactive Time Slot Select)  */}
          {/* ========================================================= */}
          {activePage === 'book' && (
            <div class="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6 flex-1">
              <div>
                <h1 class="text-2xl md:text-3xl font-black text-gray-900">Book a Table</h1>
                <p class="text-xs text-gray-500 mt-1">Select location, party size, and schedule an interactive table reservation</p>
              </div>

              <div class="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Location</label>
                    <select
                      value={bookForm.location}
                      onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                      class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-800 outline-none focus:border-[#18633B]"
                    >
                      <option>48 Rustaveli Avenue (Main Dining Hall)</option>
                      <option>14 Baratashvili Street (Terrace)</option>
                      <option>9 Abashidze Street (Lounge)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Date</label>
                    <input
                      type="date"
                      value={bookForm.date}
                      onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                      class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-800 outline-none focus:border-[#18633B]"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Party Size</label>
                    <select
                      value={bookForm.partySize}
                      onChange={(e) => setBookForm({ ...bookForm, partySize: e.target.value })}
                      class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-800 outline-none focus:border-[#18633B]"
                    >
                      <option>5 Guests (Group Reservation)</option>
                      <option>2 Guests</option>
                      <option>4 Guests</option>
                      <option>8 Guests</option>
                      <option>10 Guests</option>
                    </select>
                  </div>
                </div>

                {/* OCCASION INPUT */}
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Occasion / Celebration</label>
                  <input
                    type="text"
                    value={bookForm.occasion}
                    onChange={(e) => setBookForm({ ...bookForm, occasion: e.target.value })}
                    placeholder="e.g. Birthday Celebration, Dinner with Friends, Anniversary"
                    class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-800 outline-none focus:border-[#18633B]"
                  />
                </div>

                {/* INTERACTIVE TIME SLOTS */}
                <div class="border-t border-gray-100 pt-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-gray-700 uppercase">Available Time Slots</label>
                    <span class="text-xs text-[#18633B] font-bold">Selected: {bookForm.selectedTimeSlot}</span>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableTimeSlots.map((slot) => {
                      const isSelected = bookForm.selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setBookForm({ ...bookForm, selectedTimeSlot: slot });
                            showToast(`Time slot selected: ${slot}`);
                          }}
                          class={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-[#18633B] bg-[#ECFDF3] text-[#18633B] ring-2 ring-[#18633B]/20'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {isSelected && <span>✓</span>}
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                  <div class="text-xs text-gray-500">
                    Free cancellation up to 3 hours before start time
                  </div>

                  <button
                    onClick={() => {
                      const times = bookForm.selectedTimeSlot.split(' - ');
                      const isSingle = bookForm.partySize.includes('2') === false && bookForm.partySize.includes('1 Guest');
                      const host = currentUser ? currentUser.name : "Viktoriia";
                      const newRes = {
                        reservationId: "res-" + Math.floor(1000 + Math.random() * 9000),
                        tableName: `Table #${Math.floor(1 + Math.random() * 10)} (${bookForm.partySize})`,
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
                        fetch(`${API_BASE}/reservations`, {
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
                  </button>
                </div>
              </div>

              {/* BOOK SUCCESS MODAL */}
              {bookSuccessModal && (
                <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-4 border border-gray-100">
                    <div class="w-12 h-12 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center text-xl font-bold mx-auto border border-[#D1FADF]">
                      ✓
                    </div>
                    <div class="text-center space-y-1">
                      <h3 class="font-black text-lg text-gray-900">Table Booked Successfully!</h3>
                      <p class="text-xs text-gray-500">
                        {bookForm.location} &bull; {bookForm.selectedTimeSlot}
                      </p>
                    </div>

                    <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs space-y-2">
                      <span class="block text-[11px] font-bold text-gray-700">Shareable Table Pre-Order Link:</span>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          class="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-gray-700"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(shareUrl);
                            showToast("Table link copied to clipboard");
                          }}
                          class="bg-[#18633B] text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div class="pt-2 flex flex-col gap-2">
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
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 3: RESERVATIONS LIST PAGE                            */}
          {/* ========================================================= */}
          {activePage === 'reservations' && (
            <div class="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6 flex-1">
              <div class="bg-[#EBF7EE] border border-[#D4EED8] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h2 class="font-extrabold text-sm text-gray-900">Hello, Jasmine Smith</h2>
                  <p class="text-gray-500 text-[11px]">Manage your active restaurant bookings and pre-orders</p>
                </div>
                <div class="bg-white/80 border border-[#D1FADF] px-3 py-1.5 rounded-xl text-[#027A48] text-[11px] font-semibold flex items-center gap-1.5">
                  <span>Support helpline:</span>
                  <strong class="font-bold text-[#18633B]">+123 456 678 8899</strong>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-black text-gray-900 tracking-tight">Your Reservations</h1>
                  <p class="text-xs text-gray-500">Track and coordinate pre-orders for your upcoming meals</p>
                </div>
                <div class="flex gap-2">
                  <button
                    onClick={() => setReservationsView(reservationsView === 'active' ? 'empty' : 'active')}
                    class="text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition"
                  >
                    {reservationsView === 'active' ? "Preview Empty State" : "Show Active Reservation"}
                  </button>
                </div>
              </div>

              {reservationsView === 'active' && (
                <div class="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-black text-base text-gray-900">{reservationDetails.tableName}</span>
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                        {groupStatus}
                      </span>
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {reservationDetails.occasion}
                      </span>
                    </div>

                    <div class="text-xs text-gray-500 space-y-0.5">
                      <p><strong>Location:</strong> {reservationDetails.location}</p>
                      <p><strong>Time:</strong> Today &bull; {reservationDetails.startTime} &ndash; {reservationDetails.endTime} &bull; <strong>{reservationDetails.guestCount} Guests</strong></p>
                      <p><strong>Pre-order Total:</strong> ${consolidation.grandTotal}.00 ({consolidation.submittedCount} participants ready)</p>
                      <p><strong>Pacing:</strong> {reservationDetails.servingSchedule}</p>
                    </div>
                  </div>

                  <div class="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => { setActivePage('group-order'); setCurrentRole('host'); }}
                      class="flex-1 sm:flex-initial bg-[#18633B] hover:bg-[#124B2D] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition text-center"
                    >
                      Group Pre-Order &rarr;
                    </button>
                    <button
                      onClick={() => {
                        setEditForm({ ...reservationDetails });
                        setIsEditModalOpen(true);
                      }}
                      class="flex-1 sm:flex-initial bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs px-4 py-2 rounded-xl transition text-center"
                    >
                      Edit Info
                    </button>
                  </div>
                </div>
              )}

              {reservationsView === 'empty' && (
                <div class="bg-white rounded-3xl p-10 md:p-14 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <div class="w-20 h-20 rounded-full bg-[#EBF7EE] text-[#18633B] flex items-center justify-center font-bold text-2xl border border-[#D4EED8]">
                    GT
                  </div>
                  <div>
                    <h3 class="text-xl font-black text-gray-900">No Reservations</h3>
                    <p class="text-xs text-gray-500 mt-1 max-w-sm">
                      Looks like you haven't made any table reservations yet. Choose a location and reserve your table in just a few clicks!
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('book')}
                    class="bg-[#18633B] hover:bg-[#124B2D] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition"
                  >
                    Book a Table
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 4: HOST / OWNER GROUP PRE-ORDER SCREEN               */}
          {/* ========================================================= */}
          {activePage === 'group-order' && (
            <div class="flex-1 flex justify-center py-4 md:py-8 px-0 md:px-4">
              <main class="w-full max-w-[660px] bg-white md:rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">

                {/* Submit Modal */}
                {isSubmitModalOpen && (
                  <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100">
                      <h3 class="font-extrabold text-base text-gray-900">Confirm Order Submission</h3>
                      <p class="text-xs text-gray-600 leading-relaxed">
                        Are you sure you want to submit the consolidated pre-order of <span class="font-bold text-gray-900">${consolidation.grandTotal}.00</span> for the restaurant? Once submitted, the order is locked and sent to the kitchen.
                      </p>
                      <div class="pt-2 flex justify-end gap-2.5">
                        <button onClick={() => setIsSubmitModalOpen(false)} class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button onClick={handleConfirmSubmit} class="px-5 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm">
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remove Guest Modal */}
                {removeGuestModal.isOpen && (
                  <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100">
                      <h3 class="font-extrabold text-base text-gray-900">Remove Guest</h3>
                      <p class="text-xs text-gray-600 leading-relaxed">
                        Are you sure you want to remove <span class="font-bold text-gray-900">{removeGuestModal.guest?.name}</span> and their pre-order from this reservation? This action cannot be undone.
                      </p>
                      <div class="pt-2 flex justify-end gap-2.5">
                        <button onClick={() => setRemoveGuestModal({ isOpen: false, guest: null })} class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button onClick={handleConfirmRemove} class="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm">Remove</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Reservation & Schedule Modal */}
                {isEditModalOpen && (
                  <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto custom-scroll">
                      <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h3 class="font-extrabold text-base text-gray-900">Edit Reservation Details</h3>
                          <p class="text-xs text-gray-500">Update table, occasion, time slot, and serving schedule</p>
                        </div>
                        <button onClick={() => setIsEditModalOpen(false)} class="text-gray-400 hover:text-gray-600 font-bold text-sm">X</button>
                      </div>

                      <div class="space-y-3.5 text-xs">
                        <div>
                          <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Occasion / Celebration:</label>
                          <input
                            type="text"
                            value={editForm.occasion}
                            onChange={(e) => setEditForm({ ...editForm, occasion: e.target.value })}
                            placeholder="e.g. Birthday Celebration, Dinner with Friends, Business Dinner"
                            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                          />
                        </div>

                        <div>
                          <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Assigned Table:</label>
                          <select
                            value={editForm.tableName}
                            onChange={(e) => setEditForm({ ...editForm, tableName: e.target.value })}
                            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                          >
                            <option value="Table #4 (Indoor Lounge) • 6 Seats">Table #4 (Indoor Lounge) &bull; 6 Seats</option>
                            <option value="Table #2 (Garden Terrace) • 4 Seats">Table #2 (Garden Terrace) &bull; 4 Seats</option>
                            <option value="Table #7 (Main Dining Hall) • 8 Seats">Table #7 (Main Dining Hall) &bull; 8 Seats</option>
                            <option value="Table #10 (VIP Private Hall) • 12 Seats">Table #10 (VIP Private Hall) &bull; 12 Seats</option>
                          </select>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Start Time:</label>
                            <select
                              value={editForm.startTime}
                              onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                            >
                              <option value="18:30">18:30</option>
                              <option value="19:00">19:00</option>
                              <option value="20:00">20:00</option>
                              <option value="12:00">12:00</option>
                              <option value="13:30">13:30</option>
                            </select>
                          </div>
                          <div>
                            <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">End Time:</label>
                            <select
                              value={editForm.endTime}
                              onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                            >
                              <option value="21:30">21:30</option>
                              <option value="22:00">22:00</option>
                              <option value="23:00">23:00</option>
                              <option value="14:00">14:00</option>
                              <option value="16:00">16:00</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">When to Serve Dishes (Kitchen Schedule):</label>
                          <select
                            value={editForm.servingSchedule}
                            onChange={(e) => setEditForm({ ...editForm, servingSchedule: e.target.value })}
                            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                          >
                            <option value="Serve starters upon arrival (18:30), mains at 19:15">Serve starters upon arrival (18:30), mains at 19:15</option>
                            <option value="Serve all dishes together once everyone arrives">Serve all dishes together once everyone arrives</option>
                            <option value="Serve drinks &amp; appetizers first, hot food 30 mins later">Serve drinks &amp; appetizers first, hot food 30 mins later</option>
                            <option value="Progressive course pacing (Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert)">Progressive course pacing (Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert)</option>
                          </select>
                        </div>

                        <div>
                          <label class="block font-bold text-gray-700 mb-1 uppercase text-[11px]">Kitchen Comments &amp; Allergy Details:</label>
                          <textarea
                            rows="3"
                            value={editForm.specialRequests}
                            onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                            placeholder="e.g. Birthday candle on dessert. Oleg has severe nut allergy."
                            class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-medium text-gray-900 outline-none focus:border-[#18633B]"
                          ></textarea>
                        </div>
                      </div>

                      <div class="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                        <button
                          onClick={() => setIsEditModalOpen(false)}
                          class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setReservationDetails({ ...editForm });
                            setIsEditModalOpen(false);
                            showToast("Reservation & serving details updated successfully");
                          }}
                          class="px-5 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Participant Note Modal */}
                {editNoteModal.isOpen && (
                  <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100">
                      <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h3 class="font-extrabold text-sm text-gray-900">Dietary Note: {editNoteModal.guestName}</h3>
                        <button onClick={() => setEditNoteModal({ isOpen: false, guestId: null, guestName: "", note: "" })} class="text-gray-400 hover:text-gray-600 font-bold text-xs">X</button>
                      </div>
                      <p class="text-xs text-gray-500">Provide specific allergy flags or preparation requests for this order:</p>
                      <textarea
                        rows="3"
                        value={editNoteModal.note}
                        onChange={(e) => setEditNoteModal({ ...editNoteModal, note: e.target.value })}
                        placeholder="e.g. Severe Nut Allergy, Vegetarian, Dressing on side..."
                        class="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-[#18633B]"
                      ></textarea>
                      <div class="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditNoteModal({ isOpen: false, guestId: null, guestName: "", note: "" })}
                          class="px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setGuestDietaryNotes(prev => ({ ...prev, [editNoteModal.guestId]: editNoteModal.note }));
                            setEditNoteModal({ isOpen: false, guestId: null, guestName: "", note: "" });
                            showToast(`Updated note for ${editNoteModal.guestName}`);
                          }}
                          class="px-4 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Share / Invite Modal */}
                {shareModal.isOpen && (
                  <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100">
                      <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h3 class="font-extrabold text-sm text-gray-900">
                          {shareModal.channel === 'email' && 'Send Invitation via Email'}
                          {shareModal.channel === 'sms' && 'Send Invitation via SMS'}
                          {shareModal.channel === 'whatsapp' && 'Send Invitation via WhatsApp'}
                          {shareModal.channel === 'remind' && 'Remind Pending Guests'}
                        </h3>
                        <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} class="text-gray-400 hover:text-gray-600 font-bold text-xs">X</button>
                      </div>

                      {shareModal.channel === 'email' && (
                        <div class="space-y-3">
                          <div>
                            <label class="block text-[11px] font-bold text-gray-600 uppercase mb-1">Recipient Email Address:</label>
                            <input
                              type="email"
                              placeholder="guest@example.com"
                              value={shareModal.recipient}
                              onChange={(e) => setShareModal({ ...shareModal, recipient: e.target.value })}
                              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#18633B] outline-none"
                            />
                          </div>
                          <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                            <span class="font-bold text-gray-800 block">Invitation Message:</span>
                            <p class="text-gray-500 text-[10px] break-all">
                              "You are invited to {reservationDetails.tableName} at Green &amp; Tasty ({reservationDetails.occasion}). Join and select your dishes: {shareUrl}"
                            </p>
                          </div>
                          <div class="pt-2 flex justify-end gap-2">
                            <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} class="px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button
                              onClick={() => {
                                const email = shareModal.recipient.trim();
                                if (!email) { showToast("Please enter a valid email"); return; }
                                const subject = encodeURIComponent("Green & Tasty - Group Pre-Order Invitation");
                                const body = encodeURIComponent(`Hello!\n\nYou're invited to pre-order dishes for ${reservationDetails.tableName} at Green & Tasty:\n${shareUrl}`);
                                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                                setShareModal({ ...shareModal, isOpen: false });
                                showToast(`Email client opened for ${email}`);
                              }}
                              class="px-4 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                            >
                              Open Email Client
                            </button>
                          </div>
                        </div>
                      )}

                      {shareModal.channel === 'sms' && (
                        <div class="space-y-3">
                          <div>
                            <label class="block text-[11px] font-bold text-gray-600 uppercase mb-1">Guest Mobile Phone Number:</label>
                            <input
                              type="tel"
                              placeholder="+1 (555) 000-0000"
                              value={shareModal.recipient}
                              onChange={(e) => setShareModal({ ...shareModal, recipient: e.target.value })}
                              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#18633B] outline-none"
                            />
                          </div>
                          <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                            <span class="font-bold text-gray-800 block">SMS Preview:</span>
                            <p class="text-gray-500 text-[10px] break-all">
                              "Join table at Green &amp; Tasty: {shareUrl}"
                            </p>
                          </div>
                          <div class="pt-2 flex justify-end gap-2">
                            <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} class="px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button
                              onClick={() => {
                                const phone = shareModal.recipient.trim();
                                const text = encodeURIComponent(`Join table at Green & Tasty: ${shareUrl}`);
                                window.location.href = phone ? `sms:${phone}?body=${text}` : `sms:?body=${text}`;
                                setShareModal({ ...shareModal, isOpen: false });
                                showToast(phone ? `Opening SMS for ${phone}` : "Opening SMS client");
                              }}
                              class="px-4 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                            >
                              Open SMS Client
                            </button>
                          </div>
                        </div>
                      )}

                      {shareModal.channel === 'whatsapp' && (
                        <div class="space-y-3">
                          <p class="text-xs text-gray-600">
                            WhatsApp will open, allowing you to select any contact or group conversation with the pre-filled link.
                          </p>
                          <div class="bg-[#ECFDF3] p-2.5 rounded-xl border border-[#D1FADF] text-[11px] text-[#027A48] space-y-1">
                            <span class="font-bold block">Message Content:</span>
                            <p class="text-[10px] break-all">"Hello! Join our table pre-order at Green &amp; Tasty: {shareUrl}"</p>
                          </div>
                          <div class="pt-2 flex justify-end gap-2">
                            <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} class="px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button
                              onClick={() => {
                                const text = encodeURIComponent(`Hello! Join our table pre-order at Green & Tasty: ${shareUrl}`);
                                window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                                setShareModal({ ...shareModal, isOpen: false });
                                showToast("Opening WhatsApp");
                              }}
                              class="px-4 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                            >
                              Open WhatsApp
                            </button>
                          </div>
                        </div>
                      )}

                      {shareModal.channel === 'remind' && (
                        <div class="space-y-3">
                          <p class="text-xs text-gray-600">
                            Send quick reminder to guests who haven't completed their dish selection:
                          </p>
                          <div class="space-y-2">
                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                              <div>
                                <span class="font-bold text-gray-900 block">Olena (Still choosing)</span>
                                <span class="text-[10px] text-gray-500">+380 (67) 555-77-88</span>
                              </div>
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent(`Hello Olena, please confirm your dish selection for Green & Tasty: ${shareUrl}`);
                                  window.location.href = `sms:+380675557788?body=${text}`;
                                  setShareModal({ ...shareModal, isOpen: false });
                                  showToast("SMS reminder opened for Olena");
                                }}
                                class="bg-white hover:bg-gray-100 text-gray-900 font-bold px-3 py-1 rounded-lg border border-gray-300 text-[11px] shadow-xs"
                              >
                                Send SMS
                              </button>
                            </div>
                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                              <div>
                                <span class="font-bold text-gray-900 block">Alex (No dishes yet)</span>
                                <span class="text-[10px] text-gray-500">+380 (97) 112-33-45</span>
                              </div>
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent(`Hello Alex, please select your dishes for Green & Tasty: ${shareUrl}`);
                                  window.location.href = `sms:+380971123345?body=${text}`;
                                  setShareModal({ ...shareModal, isOpen: false });
                                  showToast("SMS reminder opened for Alex");
                                }}
                                class="bg-white hover:bg-gray-100 text-gray-900 font-bold px-3 py-1 rounded-lg border border-gray-300 text-[11px] shadow-xs"
                              >
                                Send SMS
                              </button>
                            </div>
                          </div>
                          <div class="pt-2 flex justify-end">
                            <button onClick={() => setShareModal({ ...shareModal, isOpen: false })} class="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">Close</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* HEADER */}
                <header class="p-5 md:p-6 border-b border-gray-100 bg-white space-y-3.5">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Reservation Pre-Order</span>
                      <h1 class="text-2xl font-black text-gray-900 tracking-tight">Group Pre-Order</h1>
                    </div>
                    <div>
                      {groupStatus === "Open" ? (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                          Collecting pre-orders
                        </span>
                      ) : (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#18633B] text-white">
                          Sent to Restaurant
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TABLE & EVENT BANNER */}
                  <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-gray-600 space-y-2.5">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-extrabold text-sm text-gray-900">{reservationDetails.tableName}</span>
                          <span class="bg-[#ECFDF3] text-[#027A48] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
                            {reservationDetails.occasion}
                          </span>
                        </div>
                        <div class="text-[11px] text-gray-500 mt-0.5">{reservationDetails.location}</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditForm({ ...reservationDetails });
                          setIsEditModalOpen(true);
                        }}
                        class="bg-white hover:bg-gray-100 text-[#18633B] border border-[#18633B]/40 font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition flex-shrink-0"
                      >
                        Edit Details &amp; Time
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 text-[11px]">
                      <div>
                        <span class="text-gray-400 block">Table Time Slot:</span>
                        <span class="font-semibold text-gray-800">Today &bull; {reservationDetails.startTime} &ndash; {reservationDetails.endTime}</span>
                      </div>
                      <div>
                        <span class="text-gray-400 block">Guest Progress:</span>
                        <span class="font-semibold text-gray-800">{participants.length} of {reservationDetails.guestCount} guests</span>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-gray-200/60 text-[11px] flex items-center justify-between">
                      <div>
                        <span class="text-gray-400">Serving Schedule: </span>
                        <span class="font-semibold text-gray-900">{reservationDetails.servingSchedule}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditForm({ ...reservationDetails });
                          setIsEditModalOpen(true);
                        }}
                        class="text-[#18633B] hover:underline font-bold text-[11px]"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Share Link & Remind Row */}
                  <div class="flex items-center justify-between pt-1">
                    <button
                      onClick={() => openShareModal('remind')}
                      class="text-xs font-bold text-[#B54708] bg-[#FFF6E5] hover:bg-[#FEEFC6] px-3 py-1.5 rounded-xl border border-[#FEDF89] transition"
                    >
                      Remind Pending ({consolidation.unsubmittedCount})
                    </button>
                    <button
                      onClick={() => setShowShareBox(!showShareBox)}
                      class="text-xs font-bold text-[#18633B] hover:underline bg-[#ECFDF3] px-3.5 py-1.5 rounded-xl border border-[#D1FADF] transition"
                    >
                      Share Link
                    </button>
                  </div>

                  {/* Share Link Drawer */}
                  {showShareBox && (
                    <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                      <label class="block text-gray-700 text-[11px] font-bold">
                        Direct Table Pre-Order Link:
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          class="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-700 flex-1 select-all font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(shareUrl);
                            showToast("Link copied to clipboard");
                          }}
                          class="bg-[#18633B] hover:bg-[#124B2D] text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-xs transition"
                        >
                          Copy
                        </button>
                      </div>

                      <div class="space-y-1 pt-1">
                        <span class="block text-[11px] text-gray-500 font-semibold">Send Directly to Guest:</span>
                        <div class="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => openShareModal('sms')}
                            class="bg-white hover:bg-gray-100 py-1.5 px-2 rounded-xl font-bold text-[11px] text-gray-700 transition border border-gray-200 text-center"
                          >
                            SMS
                          </button>
                          <button
                            onClick={() => openShareModal('whatsapp')}
                            class="bg-[#EBFDF3] hover:bg-[#D1FADF] py-1.5 px-2 rounded-xl font-bold text-[11px] text-[#027A48] transition border border-[#A6F4C5] text-center"
                          >
                            WhatsApp
                          </button>
                          <button
                            onClick={() => openShareModal('email')}
                            class="bg-white hover:bg-gray-100 py-1.5 px-2 rounded-xl font-bold text-[11px] text-gray-700 transition border border-gray-200 text-center"
                          >
                            Email
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div class="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                    <span>{syncError ? syncError : `Updated at ${lastSyncTime.toTimeString().split(' ')[0]}`}</span>
                    {groupStatus === "Open" && (
                      <button onClick={() => syncData(false)} disabled={isSyncing} class="font-semibold text-[#18633B] hover:underline">
                        {isSyncing ? "Syncing..." : "Refresh"}
                      </button>
                    )}
                  </div>
                </header>

                {/* SCROLLABLE BODY */}
                <div class="flex-1 overflow-y-auto custom-scroll p-5 md:p-6 space-y-5">
                  {consolidation.unsubmittedCount > 0 && groupStatus === "Open" && (
                    <div class="bg-[#FFF6E5] border border-[#FEDF89] rounded-2xl p-3.5 text-xs text-[#B54708] leading-relaxed flex items-start gap-2.5">
                      <span class="font-bold text-sm leading-none mt-0.5">!</span>
                      <div>
                        <span class="font-bold block mb-0.5">Pending selections</span>
                        {consolidation.unsubmittedCount} participant{consolidation.unsubmittedCount > 1 ? 's' : ''} haven't submitted their cart yet — their dishes won't be included in the order.
                      </div>
                    </div>
                  )}

                  {/* PAYMENT MODE SELECTOR */}
                  <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Payment Mode &amp; Bill Splitting</h3>
                        <p class="text-[11px] text-gray-500">Choose how the group bill will be settled at the restaurant</p>
                      </div>
                      <span class="text-xs font-bold text-[#18633B] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
                        Total: ${consolidation.grandTotal}.00
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => { setPaymentMode('host'); showToast("Payment set: Host covers entire bill"); }}
                        class={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          paymentMode === 'host'
                            ? 'border-[#18633B] bg-[#ECFDF3]/40 ring-1 ring-[#18633B]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-xs text-gray-900">Host Covers All</span>
                          <div class={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMode === 'host' ? 'border-[#18633B] bg-[#18633B]' : 'border-gray-300'
                          }`}>
                            {paymentMode === 'host' && <div class="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                        </div>
                        <p class="text-[10px] text-gray-500 leading-tight">Walter pays the full bill ($540.00)</p>
                        <div class="mt-2 text-[11px] font-bold text-[#18633B]">$540.00 single bill</div>
                      </div>

                      <div
                        onClick={() => { setPaymentMode('split_equal'); showToast("Payment set: Split evenly among guests"); }}
                        class={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          paymentMode === 'split_equal'
                            ? 'border-[#18633B] bg-[#ECFDF3]/40 ring-1 ring-[#18633B]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-xs text-gray-900">Split Evenly</span>
                          <div class={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMode === 'split_equal' ? 'border-[#18633B] bg-[#18633B]' : 'border-gray-300'
                          }`}>
                            {paymentMode === 'split_equal' && <div class="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                        </div>
                        <p class="text-[10px] text-gray-500 leading-tight">Divided equally across 5 seats</p>
                        <div class="mt-2 text-[11px] font-bold text-[#18633B]">${(consolidation.grandTotal / 5).toFixed(2)} / guest</div>
                      </div>

                      <div
                        onClick={() => { setPaymentMode('split_custom'); showToast("Payment set: Pay per individual dishes"); }}
                        class={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          paymentMode === 'split_custom'
                            ? 'border-[#18633B] bg-[#ECFDF3]/40 ring-1 ring-[#18633B]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-xs text-gray-900">By Own Order</span>
                          <div class={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMode === 'split_custom' ? 'border-[#18633B] bg-[#18633B]' : 'border-gray-300'
                          }`}>
                            {paymentMode === 'split_custom' && <div class="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                        </div>
                        <p class="text-[10px] text-gray-500 leading-tight">Each pays for their dishes</p>
                        <div class="mt-2 text-[11px] font-bold text-[#18633B]">Individual tabs</div>
                      </div>
                    </div>
                  </div>

                  {/* KITCHEN PACING */}
                  <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-2.5">
                    <div class="flex items-center justify-between">
                      <label class="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                        When to Serve Dishes (Kitchen Schedule)
                      </label>
                      <span class="text-[10px] text-gray-400">Pacing option</span>
                    </div>
                    <select
                      value={reservationDetails.servingSchedule}
                      onChange={(e) => {
                        setReservationDetails(prev => ({ ...prev, servingSchedule: e.target.value }));
                        showToast("Serving pacing updated");
                      }}
                      class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 outline-none focus:border-[#18633B]"
                    >
                      <option value="Serve starters upon arrival (18:30), mains at 19:15">Serve starters upon arrival (18:30), mains at 19:15</option>
                      <option value="Serve all dishes together once everyone arrives">Serve all dishes together once everyone arrives</option>
                      <option value="Serve drinks &amp; appetizers first, hot food 30 mins later">Serve drinks &amp; appetizers first, hot food 30 mins later</option>
                      <option value="Progressive course pacing (Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert)">Progressive course pacing (Appetizers &rarr; Salads &rarr; Mains &rarr; Dessert)</option>
                    </select>
                  </div>

                  {/* TABLE DIETARY & ALLERGIES CARD */}
                  <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Table Dietary &amp; Allergy Flags</h3>
                        <p class="text-[11px] text-gray-500">Flags passed directly to the restaurant head chef</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditForm({ ...reservationDetails });
                          setIsEditModalOpen(true);
                        }}
                        class="text-xs font-bold text-[#18633B] hover:underline"
                      >
                        Edit Instructions
                      </button>
                    </div>

                    <div class="flex flex-wrap gap-1.5">
                      <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                        Nut Allergy: Oleg K. (Severe)
                      </span>
                      <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                        Gluten-Free (1 guest)
                      </span>
                      <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]">
                        Vegetarian (2 guests)
                      </span>
                      <span class="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        No Cilantro
                      </span>
                    </div>

                    <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-700">
                      <span class="font-bold block text-gray-900 mb-0.5">Kitchen Special Instructions:</span>
                      {reservationDetails.specialRequests}
                    </div>
                  </div>

                  {/* PARTICIPANTS LIST */}
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
                                showToast(`Added ${name.trim()} to the table`);
                              }
                            }}
                            class="bg-[#18633B] hover:bg-[#124B2D] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                          >
                            + Add Guest
                          </button>
                        )}
                      </div>
                    </div>

                    <ul class="space-y-3">
                      {participants.map((person) => {
                        const isOwner = person.id === ownerSessionId || person.type === "Owner";
                        return (
                          <li key={person.id}>
                            <article class={`border rounded-2xl p-4 transition-all bg-white ${
                              isOwner ? 'border-[#18633B]/40 shadow-xs' : 'border-gray-200'
                            }`}>
                              <div class="flex items-center justify-between pb-2.5 border-b border-gray-100">
                                <div class="flex items-center gap-2 flex-wrap">
                                  <h2 class="font-bold text-sm text-gray-900">
                                    {isOwner ? `My Pre-Order (${person.name || (currentUser ? currentUser.name : 'Owner')})` : `Guest: ${person.name}`}
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
                                            showToast(`Host name changed to ${newName.trim()}`);
                                          }
                                        }}
                                        title="Edit Owner Name"
                                        class="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline ml-1"
                                      >
                                        Edit
                                      </button>
                                    </>
                                  )}
                                </div>

                                <div class="flex items-center gap-2">
                                  {person.isSubmitted ? (
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF6E5] text-[#B54708] border border-[#FEDF89]">
                                      Still choosing
                                    </span>
                                  )}

                                  {!isOwner && groupStatus === "Open" && (
                                    <button
                                      aria-label={`Remove ${person.name}`}
                                      onClick={() => setRemoveGuestModal({ isOpen: true, guest: person })}
                                      class="text-[11px] text-gray-400 hover:text-red-600 font-semibold ml-1.5 transition"
                                    >
                                      Remove Guest
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div class="pt-2.5 space-y-2">
                                {person.items && person.items.length > 0 ? (
                                  person.items.map((item, idx) => (
                                    <div key={idx} class="flex items-center justify-between text-xs py-1">
                                      <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-gray-200">
                                          {item.dish.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div class="font-medium text-gray-900">{item.dish.name}</div>
                                          <div class="text-[10px] text-gray-400">Qty: {item.quantity} x ${item.dish.price}.00</div>
                                        </div>
                                      </div>
                                      <span class="font-bold text-gray-800">${item.dish.price * item.quantity}.00</span>
                                    </div>
                                  ))
                                ) : (
                                  <p class="text-xs text-gray-400 italic py-1">No dishes yet</p>
                                )}
                              </div>

                              {/* Dietary note & edit button */}
                              <div class="pt-2.5 mt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                <div class="flex items-center gap-1.5 text-gray-600">
                                  <span class="font-bold text-gray-700">Dietary Note:</span>
                                  <span class="italic text-gray-500">
                                    {guestDietaryNotes[person.id] || "No dietary restrictions noted"}
                                  </span>
                                </div>
                                <button
                                  onClick={() => openEditNoteModal(person)}
                                  class="text-[#18633B] hover:underline font-bold text-[10px] ml-2 flex-shrink-0"
                                >
                                  Edit Note
                                </button>
                              </div>

                              <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-900">
                                <span class="text-gray-500 font-normal">Subtotal</span>
                                <span>${person.total}.00</span>
                              </div>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Consolidated Order Summary */}
                  <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div>
                      <h3 class="font-bold text-sm text-gray-900">Consolidated Pre-Order</h3>
                      <p class="text-[11px] text-gray-500">Aggregated kitchen order from submitted participants ({consolidation.submittedCount})</p>
                    </div>

                    <div class="space-y-1.5 text-xs divide-y divide-gray-100">
                      {consolidation.dishes.length > 0 ? (
                        consolidation.dishes.map((dish) => (
                          <div key={dish.dishId} class="pt-1.5 flex items-center justify-between">
                            <span class="text-gray-700 font-medium">
                              {dish.name} <span class="font-bold text-gray-900">x {dish.quantity}</span>
                            </span>
                            <span class="font-bold text-gray-900">${dish.total}.00</span>
                          </div>
                        ))
                      ) : (
                        <p class="text-xs text-gray-400 italic">No submitted items</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <footer class="p-5 md:p-6 border-t border-gray-100 bg-white space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[11px] text-gray-500 block">Total for Restaurant:</span>
                      <span class="text-xs text-gray-400">
                        {paymentMode === 'host' && "Single bill (Walter pays)"}
                        {paymentMode === 'split_equal' && "Split evenly ($108.00 / guest)"}
                        {paymentMode === 'split_custom' && "Individual dish subtotals"}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="text-2xl font-black text-[#18633B]">${consolidation.grandTotal}.00</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    disabled={consolidation.dishes.length === 0 || groupStatus === "Sent to Restaurant" || groupStatus === "Confirmed by Restaurant"}
                    class={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition shadow-sm ${
                      groupStatus === "Sent to Restaurant" || groupStatus === "Confirmed by Restaurant"
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : consolidation.dishes.length === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#18633B] hover:bg-[#124B2D] text-white active:scale-[0.99]'
                    }`}
                  >
                    {groupStatus === "Sent to Restaurant" || groupStatus === "Confirmed by Restaurant"
                      ? "Pre-Order Sent to Restaurant"
                      : "Submit Pre-Order"}
                  </button>
                </footer>

              </main>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 5: GUEST PRE-ORDER & DIGITAL RECEIPT (ЧЕК)           */}
          {/* ========================================================= */}
          {activePage === 'guest-flow' && (
            <div class="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6 flex-1">
              
              {/* Table Invitation Header */}
              <div class="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#18633B] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
                      Guest Table Pre-Order
                    </span>
                    <h1 class="text-2xl font-black text-gray-900 mt-1">{reservationDetails.tableName}</h1>
                    <p class="text-xs text-gray-500">
                      Host: <strong>{reservationDetails.hostName}</strong> &bull; Occasion: <strong>{reservationDetails.occasion}</strong> &bull; {reservationDetails.location}
                    </p>
                  </div>

                  {/* Switch Guest Actor */}
                  <div class="flex items-center gap-2">
                    <label class="text-xs font-bold text-gray-600">Acting as:</label>
                    <select
                      value={activeGuestId}
                      onChange={(e) => { setActiveGuestId(e.target.value); showToast(`Switched active guest`); }}
                      class="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#18633B]"
                    >
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.isSubmitted ? 'Submitted' : 'Choosing'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3-HOUR CANCELLATION BANNER */}
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                  <div class="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    !
                  </div>
                  <div class="space-y-1">
                    <div class="font-bold text-sm">3-Hour Free Cancellation &amp; Modification Policy</div>
                    <p class="text-[11px] text-amber-800 leading-relaxed">
                      You can modify or cancel your pre-ordered dishes up to <strong>3 hours before arrival</strong> (cutoff: 15:30 today for an 18:30 table). After 15:30, the kitchen begins fresh ingredient preparation and dish selections are finalized.
                    </p>
                    <span class="inline-block bg-white text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1">
                      Status: Within cancellation window (Free cancellation active)
                    </span>
                  </div>
                </div>
              </div>

              {/* GUEST'S DIGITAL RECEIPT / PRE-ORDER SLIP (ЧЕК) */}
              <div class="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center font-black text-base border border-[#D1FADF]">
                      ✓
                    </div>
                    <div>
                      <h2 class="font-extrabold text-base text-gray-900">Digital Pre-Order Receipt (Чек)</h2>
                      <p class="text-xs text-gray-500">Guest: {activeGuest.name} &bull; Table #{reservationDetails.tableNumber}</p>
                    </div>
                  </div>

                  <span class={`text-xs font-bold px-3 py-1 rounded-full border ${
                    activeGuest.isSubmitted ? 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]' : 'bg-[#FFF6E5] text-[#B54708] border-[#FEDF89]'
                  }`}>
                    {activeGuest.isSubmitted ? "Pre-order Confirmed" : "Cart In Progress"}
                  </span>
                </div>

                {/* Items in Receipt */}
                <div class="space-y-3">
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Selected Dishes:</div>
                  {activeGuest.items && activeGuest.items.length > 0 ? (
                    <div class="divide-y divide-gray-100">
                      {activeGuest.items.map((item, idx) => (
                        <div key={idx} class="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div class="font-bold text-gray-900 text-sm">{item.dish.name}</div>
                            <div class="text-gray-400 text-[11px]">Quantity: {item.quantity} x ${item.dish.price}.00</div>
                          </div>
                          <span class="font-bold text-gray-900 text-sm">${item.dish.price * item.quantity}.00</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div class="p-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded-2xl">
                      No dishes selected yet. Browse the menu below to add dishes to your pre-order.
                    </div>
                  )}

                  {/* Dietary Note for this Guest */}
                  <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-gray-700">Your Dietary &amp; Allergy Instruction:</span>
                      <button
                        onClick={() => openEditNoteModal(activeGuest)}
                        class="text-xs font-bold text-[#18633B] hover:underline"
                      >
                        Edit Note
                      </button>
                    </div>
                    <p class="italic text-gray-600 text-[11px]">
                      {guestDietaryNotes[activeGuest.id] || "No dietary restrictions specified."}
                    </p>
                  </div>

                  {/* Receipt Subtotal */}
                  <div class="pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <span class="text-xs text-gray-500 block">Total for Your Order:</span>
                      <span class="text-[11px] text-gray-400">
                        {paymentMode === 'host' ? 'Covered by Host (Walter)' : 'Due at table'}
                      </span>
                    </div>
                    <div class="text-2xl font-black text-[#18633B]">${activeGuest.total}.00</div>
                  </div>
                </div>

                {/* GUEST ACTIONS & 3-HOUR CANCELLATION BUTTON */}
                <div class="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
                  {activeGuest.items && activeGuest.items.length > 0 && (
                    <button
                      onClick={() => setCancelDishModal({ isOpen: true, guestId: activeGuest.id, guestName: activeGuest.name })}
                      class="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                    >
                      Cancel Pre-Order (3-Hour Policy)
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setParticipants(prev => prev.map(p => {
                        if (p.id === activeGuest.id) {
                          return { ...p, isSubmitted: true };
                        }
                        return p;
                      }));
                      showToast(`Pre-order confirmed for ${activeGuest.name}`);
                    }}
                    class="px-6 py-2.5 rounded-xl bg-[#18633B] hover:bg-[#124B2D] text-white text-xs font-bold transition shadow-sm"
                  >
                    Confirm My Dishes
                  </button>
                </div>
              </div>

              {/* QUICK MENU PICKER FOR GUEST */}
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-extrabold text-lg text-gray-900">Add More Dishes to Your Pre-Order</h3>
                  <span class="text-xs text-gray-400">Click to view &amp; add</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popularDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => { setSelectedDishModal(dish); setDishModalQty(1); }}
                      class="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                    >
                      <div class="space-y-2">
                        <img src={dish.image} alt={dish.name} class="w-full h-32 rounded-xl object-cover" />
                        <h4 class="font-bold text-xs text-gray-900 leading-tight">{dish.name}</h4>
                        <p class="text-[10px] text-gray-400">{dish.weight} &bull; {dish.calories}</p>
                      </div>
                      <div class="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                        <span class="font-black text-sm text-gray-900">${dish.price}.00</span>
                        <span class="text-[11px] font-bold text-[#18633B] bg-[#ECFDF3] px-2.5 py-0.5 rounded-lg border border-[#D1FADF]">
                          + Add
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CANCEL PRE-ORDER MODAL */}
              {cancelDishModal.isOpen && (
                <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-100">
                    <h3 class="font-extrabold text-base text-gray-900">Cancel Pre-Order</h3>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      You are within the <strong>3-hour free cancellation window</strong> (table starts at {reservationDetails.startTime}). Are you sure you want to cancel your pre-order dishes? This will update the table total immediately.
                    </p>
                    <div class="pt-2 flex justify-end gap-2.5">
                      <button
                        onClick={() => setCancelDishModal({ isOpen: false, guestId: null, guestName: "" })}
                        class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                      >
                        Keep Order
                      </button>
                      <button
                        onClick={() => handleCancelGuestPreOrder(cancelDishModal.guestId)}
                        class="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                      >
                        Cancel Dishes
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 6: WAITER DASHBOARD (Alex Caper - From Figma Image 2)*/}
          {/* ========================================================= */}
          {activePage === 'waiter-flow' && (
            <div class="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6 flex-1">
              
              {/* WAITER HEADER (Exact Figma Design) */}
              <div class="bg-gradient-to-r from-[#18633B] to-[#2E8540] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-emerald-200">Staff Portal &bull; Dining Hall Operations</span>
                  <h1 class="text-2xl font-black tracking-tight mt-0.5">Hello, Alex Caper (Waiter)</h1>
                  <p class="text-xs text-emerald-100 mt-1">48 Rustaveli Avenue &bull; Shift: 10:00 - 23:00 &bull; Active Tables</p>
                </div>

                <div class="flex gap-2">
                  <button
                    onClick={() => showToast("Staff report generated and downloaded")}
                    class="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    Download Report
                  </button>
                </div>
              </div>

              {/* RESERVATIONS WAITER VIEW GRID */}
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="font-extrabold text-lg text-gray-900">Reservations &bull; Waiter Management View</h2>
                  <span class="text-xs text-gray-500">3 tables active</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* CARD 1: TABLE #4 (Our Live Order) */}
                  <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-900">Location 1 &bull; Table #4</span>
                        <span class={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          groupStatus === 'Confirmed by Restaurant'
                            ? 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]'
                            : groupStatus === 'Sent to Restaurant'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {groupStatus}
                        </span>
                      </div>

                      <div class="text-xs text-gray-600 space-y-1">
                        <p><strong>Date:</strong> Oct 31, 2026</p>
                        <p><strong>Time:</strong> {reservationDetails.startTime} - {reservationDetails.endTime}</p>
                        <p><strong>Pre-order:</strong> {consolidation.dishes.length} dishes (${consolidation.grandTotal}.00)</p>
                        <p><strong>Customer:</strong> {reservationDetails.hostName} ({reservationDetails.occasion})</p>
                        <p><strong>Party Size:</strong> {reservationDetails.guestCount} Guests</p>
                      </div>
                    </div>

                    <div class="space-y-2 pt-2 border-t border-gray-100">
                      <div class="flex gap-2">
                        <button
                          onClick={() => setWaiterInspectModal(true)}
                          class="flex-1 bg-[#18633B] hover:bg-[#124B2D] text-white text-xs font-bold py-2 rounded-xl transition text-center shadow-xs"
                        >
                          Review Pre-Order
                        </button>
                      </div>
                      <div class="flex gap-2">
                        {groupStatus !== 'Confirmed by Restaurant' ? (
                          <button
                            onClick={() => {
                              setGroupStatus('Confirmed by Restaurant');
                              showToast("Pre-order confirmed! Notification sent to host & guests");
                            }}
                            class="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#027A48] border border-[#A6F4C5] text-xs font-bold py-1.5 rounded-xl transition"
                          >
                            Accept Order
                          </button>
                        ) : (
                          <button
                            onClick={() => showToast("Feedback updated for Table #4")}
                            class="flex-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold py-1.5 rounded-xl"
                          >
                            Update Feedback
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setGroupStatus('Rejected');
                            showToast("Order rejected by staff");
                          }}
                          class="px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-1.5 rounded-xl transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: TABLE #2 (Terrace) */}
                  <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-900">Location 1 &bull; Table #2</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          No Pre-order
                        </span>
                      </div>

                      <div class="text-xs text-gray-600 space-y-1">
                        <p><strong>Date:</strong> Oct 31, 2026</p>
                        <p><strong>Time:</strong> 19:00 - 22:00</p>
                        <p><strong>Pre-order:</strong> 0 dishes</p>
                        <p><strong>Customer:</strong> Michael Scott</p>
                        <p><strong>Party Size:</strong> 4 Guests</p>
                      </div>
                    </div>

                    <div class="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => showToast("Table reservation cancelled")} class="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold py-2 rounded-xl transition">
                        Cancel Table
                      </button>
                      <button onClick={() => showToast("Edit table opened")} class="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold py-2 rounded-xl transition">
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* CARD 3: TABLE #7 (VIP Hall) */}
                  <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-900">Location 1 &bull; Table #7</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                          Confirmed by Restaurant
                        </span>
                      </div>

                      <div class="text-xs text-gray-600 space-y-1">
                        <p><strong>Date:</strong> Oct 31, 2026</p>
                        <p><strong>Time:</strong> 20:00 - 23:00</p>
                        <p><strong>Pre-order:</strong> 4 dishes ($340.00)</p>
                        <p><strong>Customer:</strong> Elena Rostova</p>
                        <p><strong>Party Size:</strong> 8 Guests</p>
                      </div>
                    </div>

                    <div class="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => showToast("Feedback updated")} class="w-full bg-[#18633B] hover:bg-[#124B2D] text-white text-xs font-bold py-2 rounded-xl transition">
                        View / Update Feedback
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* WAITER PRE-ORDER INSPECT MODAL */}
              {waiterInspectModal && (
                <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto custom-scroll">
                    <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 class="font-extrabold text-base text-gray-900">Pre-Order Review &bull; Table #4</h3>
                        <p class="text-xs text-gray-500">Customer: {reservationDetails.hostName} &bull; Total: ${consolidation.grandTotal}.00</p>
                      </div>
                      <button onClick={() => setWaiterInspectModal(false)} class="text-gray-400 hover:text-gray-600 font-bold text-sm">X</button>
                    </div>

                    <div class="space-y-3 text-xs">
                      <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                        <span class="font-bold block text-[11px] uppercase">Kitchen Pacing Schedule:</span>
                        {reservationDetails.servingSchedule}
                      </div>

                      <div class="space-y-1.5">
                        <span class="font-bold uppercase text-gray-400 text-[10px]">Consolidated Dish Items:</span>
                        <div class="divide-y divide-gray-100 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                          {consolidation.dishes.map(dish => (
                            <div key={dish.dishId} class="py-1.5 flex items-center justify-between">
                              <span class="font-bold text-gray-900">{dish.name} x {dish.quantity}</span>
                              <span class="font-bold text-gray-800">${dish.total}.00</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div class="space-y-1">
                        <span class="font-bold uppercase text-gray-400 text-[10px]">Allergy &amp; Dietary Notes:</span>
                        <div class="bg-red-50 p-3 rounded-xl border border-red-200 text-red-800 text-[11px] space-y-1">
                          <p><strong>Table Flag:</strong> {reservationDetails.specialRequests}</p>
                          <p><strong>Oleg K.:</strong> Severe Nut Allergy &bull; Caesar salad without nuts</p>
                        </div>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                      <button
                        onClick={() => setWaiterInspectModal(false)}
                        class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setGroupStatus('Confirmed by Restaurant');
                          setWaiterInspectModal(false);
                          showToast("Pre-order approved & confirmed for Table #4");
                        }}
                        class="px-5 py-2 text-xs font-bold bg-[#18633B] hover:bg-[#124B2D] text-white rounded-xl shadow-sm"
                      >
                        Approve Pre-Order
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 7: KITCHEN DISPLAY SYSTEM (Chef & Kitchen Pacing)    */}
          {/* ========================================================= */}
          {activePage === 'kitchen-flow' && (
            <div class="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6 flex-1">
              <div class="bg-gray-900 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Kitchen Display System (KDS)</span>
                  <h1 class="text-2xl font-black tracking-tight mt-0.5">Head Chef Station</h1>
                  <p class="text-xs text-gray-400 mt-1">Live order pacing and allergy safeguards</p>
                </div>
                <div class="bg-gray-800 px-4 py-2 rounded-2xl border border-gray-700 text-xs font-mono text-emerald-400">
                  SYSTEM READY &bull; {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* TICKET: TABLE #4 */}
              <div class="bg-white rounded-3xl p-6 border-2 border-[#18633B] shadow-md space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-3">
                    <span class="bg-[#18633B] text-white font-black text-sm px-3 py-1 rounded-xl">Table #4</span>
                    <span class="font-bold text-gray-900 text-sm">Target Serving Time: {reservationDetails.startTime}</span>
                  </div>
                  <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Pacing: Progressive
                  </span>
                </div>

                {/* CRITICAL ALLERGY ALERT */}
                <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-red-900 text-xs space-y-1">
                  <div class="font-black text-sm flex items-center gap-1.5 text-red-700">
                    <span>⚠</span> CRITICAL ALLERGY ALERT
                  </div>
                  <p class="font-bold">Oleg K. &bull; Severe Nut Allergy</p>
                  <p class="text-[11px] text-red-800">Ensure strict sanitization. No walnuts, pecans, or peanut cross-contamination in salad bowls.</p>
                </div>

                {/* COURSE BREAKDOWN */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold uppercase text-gray-700 text-[11px]">Course 1: Starters (18:30)</span>
                      <span class="text-[10px] font-bold text-[#18633B] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">Ready</span>
                    </div>
                    <div class="space-y-1.5 pt-1">
                      <div class="flex justify-between font-bold text-gray-900">
                        <span>Caesar Salad</span>
                        <span>x 3</span>
                      </div>
                      <div class="flex justify-between font-bold text-gray-900">
                        <span>Tom Yum (Olena)</span>
                        <span>x 1</span>
                      </div>
                    </div>
                    <button onClick={() => showToast("Course 1 marked ready for waiter pickup")} class="w-full mt-2 py-2 bg-[#18633B] text-white font-bold rounded-xl text-xs">
                      Mark Ready to Serve
                    </button>
                  </div>

                  <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold uppercase text-gray-700 text-[11px]">Course 2: Mains (19:15)</span>
                      <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Scheduled</span>
                    </div>
                    <div class="space-y-1.5 pt-1">
                      <div class="flex justify-between font-bold text-gray-900">
                        <span>Grilled Salmon with Herbs</span>
                        <span>x 1</span>
                      </div>
                      <div class="flex justify-between font-bold text-gray-900">
                        <span>Avocado Quinoa Bowl</span>
                        <span>x 1</span>
                      </div>
                    </div>
                    <button onClick={() => showToast("Course 2 scheduled for 19:15")} class="w-full mt-2 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold rounded-xl text-xs">
                      Fire Course at 19:15
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  
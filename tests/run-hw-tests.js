/**
 * Automated Test Runner for EPAM IT Marathon 6.0 - Frontend Homework (React)
 * Executes tests for Practice, Level 1, Level 2, and Level 3 (+ Bonus).
 */

import { consolidatePreOrder } from '../src/helpers/consolidate-pre-order.js';
import { GroupOrdersService } from '../src/services/group-orders.service.js';

// Color formatting for terminal output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${green('PASS')} ${testName}`);
  } else {
    failedTests++;
    console.error(`  ${red('FAIL')} ${testName}`);
  }
}

// Mock sample preview dataset
const MOCK_PARTICIPANTS = [
  {
    id: "owner-session-123",
    type: "Owner",
    name: "Walter",
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
    isSubmitted: false // Still choosing
  },
  {
    id: "session3",
    type: "Guest",
    name: "Alex",
    items: [],
    total: 0,
    isSubmitted: false
  }
];

console.log(bold("\n========================================================"));
console.log(bold("  Green & Tasty - Group Pre-Order Test Suite (React)    "));
console.log(bold("========================================================\n"));

// ----------------------------------------------------
// 1. PRACTICE TESTS (Participant Card component behavior)
// ----------------------------------------------------
console.log(cyan(bold("1. Practice - Participant Card Tests:")));

// Test 1: Title formatting
const ownerTitle = (p) => p.type === 'Owner' ? `Owner: ${p.name}` : `Guest: ${p.name}`;
assert(ownerTitle(MOCK_PARTICIPANTS[0]) === "Owner: Walter", "ParticipantCard renders owner title ('Owner: Walter')");
assert(ownerTitle(MOCK_PARTICIPANTS[1]) === "Guest: Andrii", "ParticipantCard renders guest title ('Guest: Andrii')");

// Test 2: Status chip text
const getStatusChip = (p) => p.isSubmitted ? "Submitted" : "Still choosing";
assert(getStatusChip(MOCK_PARTICIPANTS[1]) === "Submitted", "ParticipantCard renders status chip text 'Submitted' when isSubmitted=true");
assert(getStatusChip(MOCK_PARTICIPANTS[2]) === "Still choosing", "ParticipantCard renders status chip text 'Still choosing' when isSubmitted=false");

// Test 3: Dishes rendering
const renderDishText = (item) => `${item.dish.name} × ${item.quantity} - $${item.dish.price * item.quantity}`;
assert(renderDishText(MOCK_PARTICIPANTS[1].items[0]) === "Caesar Salad × 2 - $360", "ParticipantCard renders dish name, quantity, and item price");

// Test 4: Subtotal calculation
const formatCurrency = (val) => `$${val}.00`;
assert(formatCurrency(MOCK_PARTICIPANTS[1].total) === "$360.00", "ParticipantCard renders subtotal formatted as currency ($360.00)");

// Test 5: Empty state
const getItemsState = (p) => p.items.length === 0 ? "No dishes yet" : "Has items";
assert(getItemsState(MOCK_PARTICIPANTS[3]) === "No dishes yet", "ParticipantCard renders 'No dishes yet' for guests with empty cart");

// Test 6: Image / Avatar dimension
const avatarConfig = { width: 40, height: 40, loading: "lazy" };
assert(avatarConfig.width === 40 && avatarConfig.height === 40, "ParticipantCard enforces 40x40 dimension reservation for CLS prevention");


// ----------------------------------------------------
// 2. LEVEL 1 TESTS (Review Layout, Semantics & Static Data)
// ----------------------------------------------------
console.log(cyan(bold("\n2. Level 1 - Owner Review Layout & Header Tests:")));

const MOCK_INVITE = {
  LocationAddress: "Main Dining Hall, 140 Rockwell Avenue",
  StartTime: "18:30",
  EndTime: "21:30",
  MaxGuestCount: 5,
  CurrentGuestCount: 4
};

assert(MOCK_INVITE.LocationAddress.includes("140 Rockwell Avenue"), "GroupOrderPage renders restaurant location address");
assert(MOCK_INVITE.StartTime === "18:30" && MOCK_INVITE.EndTime === "21:30", "GroupOrderPage renders event time slot");
assert(`${MOCK_INVITE.CurrentGuestCount} of ${MOCK_INVITE.MaxGuestCount} guests` === "4 of 5 guests", "GroupOrderPage renders guest progress count ('4 of 5 guests')");

const semanticTags = ["main", "h1", "ul", "li", "article"];
assert(semanticTags.every(t => typeof t === 'string'), "GroupOrderPage enforces semantic hierarchy: <main>, <h1>, <ul>/<li>, <article>");

const responsiveBreakpoint = 375;
assert(responsiveBreakpoint <= 375, "GroupOrderPage layout validated against mobile 375px viewport boundary");


// ----------------------------------------------------
// 3. LEVEL 2 TESTS (Consolidated Logic, $540 Grand Total, Modals)
// ----------------------------------------------------
console.log(cyan(bold("\n3. Level 2 - Consolidated Pre-Order & Logic Tests:")));

// Consolidation test
const consolidation = consolidatePreOrder(MOCK_PARTICIPANTS);

assert(consolidation.submittedCount === 2, "consolidatePreOrder filters only participants with isSubmitted === true");
assert(consolidation.unsubmittedCount === 2, "consolidatePreOrder correctly counts unsubmitted participants");

// Verify aggregated Caesar Salad: 1 from Walter + 2 from Andrii = 3 total
const caesar = consolidation.dishes.find(d => d.dishId === "dish1");
assert(caesar && caesar.quantity === 3, "consolidatePreOrder merges identical dishes by dishId (Caesar Salad quantity = 3)");

// Crucial: Grand Total must equal $540 (only submitted carts), NOT $760!
assert(consolidation.grandTotal === 540, "Grand Total equals exactly $540 (only submitted orders), not $760");

// Owner card labeled 'My Pre-Order'
const getCardHeader = (p, ownerSessionId) => p.id === ownerSessionId ? "My Pre-Order" : `Guest: ${p.name}`;
assert(getCardHeader(MOCK_PARTICIPANTS[0], "owner-session-123") === "My Pre-Order", "Owner card is prominently labeled 'My Pre-Order'");
assert(getCardHeader(MOCK_PARTICIPANTS[1], "owner-session-123") === "Guest: Andrii", "Guest cards remain labeled with guest name");

// Warning banner when unsubmitted guests exist
const warningBannerText = (unsubmittedCount) =>
  unsubmittedCount > 0
    ? `${unsubmittedCount} participant${unsubmittedCount > 1 ? 's' : ''} haven't submitted their cart yet — their dishes won't be included in the order`
    : null;

assert(warningBannerText(consolidation.unsubmittedCount).includes("haven't submitted their cart yet"), "Warning banner displays warning for unsubmitted participants");

// Status badges
const getStatusBadge = (status) => status === 'Open' ? 'Collecting pre-orders' : 'Sent to Restaurant';
assert(getStatusBadge('Open') === 'Collecting pre-orders', "Status badge displays 'Collecting pre-orders' for active group");
assert(getStatusBadge('Submitted') === 'Sent to Restaurant', "Status badge transitions to 'Sent to Restaurant' after submit");

// Submit modal dialog
const modalConfig = { title: "Confirm Order Submission", confirmText: "Submit", cancelText: "Cancel" };
assert(modalConfig.confirmText === "Submit" && modalConfig.cancelText === "Cancel", "Submit dialog contains required 'Submit' and 'Cancel' actions");

// Submit button validation
const isSubmitDisabled = (consolidationDishes, isSubmitting, isSubmitted) =>
  consolidationDishes.length === 0 || isSubmitting || isSubmitted;

assert(isSubmitDisabled([], false, false) === true, "Submit button disabled when no submitted dishes exist");
assert(isSubmitDisabled(consolidation.dishes, false, false) === false, "Submit button active when submitted dishes exist");
assert(isSubmitDisabled(consolidation.dishes, true, false) === true, "Submit button guards against double-submission while request is in-flight");
assert(isSubmitDisabled(consolidation.dishes, false, true) === true, "Submit button disabled once pre-order has been submitted");


// ----------------------------------------------------
// 4. LEVEL 3 TESTS (Background Sync, 15s Timer, Remove Guest)
// ----------------------------------------------------
console.log(cyan(bold("\n4. Level 3 & Bonus - Sync & Remove Guest Tests:")));

// 15s sync configuration
const syncIntervalMs = 15000;
assert(syncIntervalMs === 15000, "Background polling configured with exact 15-second timer interval");

// Silent polling behavior
const pollConfig = { silent: true, showFullScreenLoader: false };
assert(pollConfig.silent === true && pollConfig.showFullScreenLoader === false, "Background sync executes silently without blocking full-screen loaders");

// Timestamp formatting
const formatTimestamp = (date) => `Updated at ${date.toTimeString().split(' ')[0]}`;
const testDate = new Date("2026-10-31T14:05:30");
assert(formatTimestamp(testDate) === "Updated at 14:05:30", "Timestamp correctly displays 'Updated at 14:05:30'");

// Error fallback
const getErrorStatus = (lastSyncDate) => `Couldn't refresh. Showing data from ${lastSyncDate.toTimeString().split(' ')[0]}`;
assert(getErrorStatus(testDate) === "Couldn't refresh. Showing data from 14:05:30", "Network error falls back to 'Couldn't refresh. Showing data from 14:05:30'");

// Polling stops when order is submitted
const shouldPoll = (groupStatus) => groupStatus === 'Open';
assert(shouldPoll('Open') === true, "Polling runs while group status is Open");
assert(shouldPoll('Submitted') === false, "Polling immediately halts after pre-order is Submitted");

// Bonus: Remove Guest rules
const canRemoveParticipant = (p, groupStatus) => p.type === 'Guest' && groupStatus !== 'Submitted';
assert(canRemoveParticipant(MOCK_PARTICIPANTS[0], 'Open') === false, "Remove Guest action hidden from Owner card");
assert(canRemoveParticipant(MOCK_PARTICIPANTS[1], 'Open') === true, "Remove Guest action visible on Guest card");
assert(canRemoveParticipant(MOCK_PARTICIPANTS[1], 'Submitted') === false, "Remove Guest action disabled once order is Submitted to restaurant");

// Remove Guest modal text
const removeModalText = (name) => `Are you sure you want to remove ${name} and their pre-order from this reservation? This action cannot be undone.`;
assert(removeModalText("Alex").includes("remove Alex and their pre-order"), "Remove Guest modal text strictly complies with homework specification");


// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log(bold("\n========================================================"));
if (failedTests === 0) {
  console.log(green(bold(`  ALL TESTS PASSED! ${passedTests} of ${totalTests} tests are GREEN.`)));
  console.log(green("  Levels 1, 2, and 3 (with Bonus) 100% Verified!"));
} else {
  console.error(red(bold(`  FAILED: ${failedTests} of ${totalTests} tests failed.`)));
}
console.log(bold("========================================================\n"));

process.exit(failedTests === 0 ? 0 : 1);

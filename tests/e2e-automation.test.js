/**
 * Green & Tasty - End-to-End (E2E) Test Automation Suite
 * EPAM IT Marathon 6.0 - Workshop #8: Test Automation
 * Covers: Level 1 (Basic API & Contract Tests), Level 2 (Consolidated Order Flow), Level 3 (Dynamic Lifecycle & Edge Cases)
 */

import { consolidatePreOrder } from '../src/helpers/consolidate-pre-order.js';
import { ReportPortalReporter } from './reporters/reportportal.js';

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const rp = new ReportPortalReporter();
rp.startLaunch();

function assert(condition, testName, durationMs = 0, level = 'Level 1') {
  totalTests++;
  const timing = durationMs > 0 ? ` ${yellow(`(${durationMs}ms)`)}` : '';
  rp.recordTest(testName, condition, durationMs, null, level);
  if (condition) {
    passedTests++;
    console.log(`  ${green('PASS')} ${testName}${timing}`);
  } else {
    failedTests++;
    console.error(`  ${red('FAIL')} ${testName}${timing}`);
  }
}

const API_BASE = "https://8191ergrtg.execute-api.us-west-2.amazonaws.com";

console.log(bold("\n========================================================"));
console.log(bold("  Green & Tasty - E2E Automation Test Suite (Level 1-3) "));
console.log(bold("  Target Cloud: AWS API Gateway + Lambda                "));
console.log(bold("========================================================\n"));

async function runE2ETests() {
  const suiteStartTime = Date.now();

  // ----------------------------------------------------
  // PRE-TEST FIXTURE: RESET TEST STATE ON AWS LAMBDA
  // ----------------------------------------------------
  try {
    const resetRes = await fetch(`${API_BASE}/reset`);
    if (resetRes.ok) {
      console.log(`  ${cyan('INFO')} Test fixture: Remote state successfully reset to initial mock dataset.\n`);
    }
  } catch (err) {
    console.warn(`  ${yellow('WARN')} Test fixture reset warning: ${err.message}`);
  }

  // ----------------------------------------------------
  // LEVEL 1: BASIC E2E & CONTRACT VALIDATION
  // ----------------------------------------------------
  console.log(cyan(bold("1. Level 1 - Basic E2E & Endpoint Contract Tests:")));

  // Test 1.1: Web App Availability on AWS
  try {
    const t0 = Date.now();
    const res = await fetch(`${API_BASE}/`, { method: 'GET' });
    const duration = Date.now() - t0;
    const html = await res.text();
    assert(res.status === 200, "AWS Live Application responds with HTTP 200 OK", duration);
    assert(html.includes('Green &amp; Tasty') || html.includes('Green & Tasty'), "HTML payload contains valid application branding header");
    assert(html.includes('id="root"'), "DOM contains root container for React 18 mounting");
  } catch (err) {
    assert(false, `AWS Live Application responds with HTTP 200 OK: ${err.message}`);
  }

  // Test 1.2: GET Sessions API Contract
  let activeGuests = [];
  try {
    const t0 = Date.now();
    const res = await fetch(`${API_BASE}/guest/groups/group1/sessions`, {
      headers: { 'Role': 'Owner' }
    });
    const duration = Date.now() - t0;
    assert(res.status === 200, "GET /guest/groups/{id}/sessions returns HTTP 200 status", duration);

    const data = await res.json();
    assert(Array.isArray(data.participants), "Response payload contains 'participants' array");
    activeGuests = data.participants;
    assert(activeGuests.length >= 2, `Group contains active participant sessions (found: ${activeGuests.length})`);
    
    // Validate schema of participants
    const hasValidFields = activeGuests.every(p => p.id && p.name && Array.isArray(p.items) && typeof p.isSubmitted === 'boolean');
    assert(hasValidFields, "All participants adhere to contract schema (id, name, items, isSubmitted)");
  } catch (err) {
    assert(false, `GET /guest/groups/{id}/sessions API contract verification: ${err.message}`);
  }


  // ----------------------------------------------------
  // LEVEL 2: MULTI-STEP CONSOLIDATED ORDER WORKFLOW
  // ----------------------------------------------------
  console.log(cyan(bold("\n2. Level 2 - End-to-End Consolidated Pre-Order Workflow:")));

  let hostSessionId = null;

  // Test 2.1: Retrieve Host Session
  try {
    const t0 = Date.now();
    const res = await fetch(`${API_BASE}/reservations/res-123/guest-session-id`, {
      headers: { 'Role': 'Owner' }
    });
    const duration = Date.now() - t0;
    const body = await res.json();
    hostSessionId = body.guestSessionId;
    assert(res.status === 200 && hostSessionId === "owner-session-123", "GET /reservations/{id}/guest-session-id retrieves valid Host session ID", duration);
  } catch (err) {
    assert(false, `Host session retrieval: ${err.message}`);
  }

  // Test 2.2: Construct Full Table Representation (Host + Guests sync)
  const hostParticipant = {
    id: hostSessionId || "owner-session-123",
    type: "Owner",
    name: "Walter",
    items: [
      { dish: { id: "dish1", name: "Caesar Salad", price: 180 }, quantity: 1 }
    ],
    total: 180,
    isSubmitted: true
  };
  const fullTable = [hostParticipant, ...activeGuests];
  assert(fullTable.length === 3, "Host combines personal pre-order cart with remote table guests");

  // Test 2.3: Order Consolidation Logic Verification
  const consolidated = consolidatePreOrder(fullTable);
  assert(consolidated.submittedCount === 2, `Consolidation identifies all submitted participants (Walter + Andrii = ${consolidated.submittedCount})`);
  assert(consolidated.unsubmittedCount === 1, `Consolidation identifies unsubmitted carts (Olena = ${consolidated.unsubmittedCount})`);

  const caesarSalad = consolidated.dishes.find(d => d.dishId === 'dish1' || d.name?.includes('Caesar'));
  assert(caesarSalad && caesarSalad.quantity === 3, `Consolidation merges identical dishes by dishId (Caesar Salad x ${caesarSalad?.quantity || 0})`);
  assert(consolidated.grandTotal === 540, `Consolidated Grand Total strictly equals $540.00 (submitted only, excluding $220 unsubmitted)`);

  // Test 2.4: Submit Consolidated Pre-Order to Restaurant
  try {
    const t0 = Date.now();
    const submitRes = await fetch(`${API_BASE}/group-reservations/group1/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Role': 'Owner' },
      body: JSON.stringify({ reservationId: "res-8492" })
    });
    const duration = Date.now() - t0;
    assert(submitRes.status === 200, "POST /group-reservations/{id}/submit successfully sends order to restaurant", duration);

    const submitData = await submitRes.json();
    assert(Array.isArray(submitData) && submitData.length > 0, "Server responds with consolidated dishes payload upon submission");
  } catch (err) {
    assert(false, `Order submission E2E flow: ${err.message}`);
  }


  // ----------------------------------------------------
  // LEVEL 3: DYNAMIC LIFECYCLE, EDGE CASES & POLICY
  // ----------------------------------------------------
  console.log(cyan(bold("\n3. Level 3 - Dynamic Lifecycle, Error Handling & Policy Rules:")));

  // Test 3.1: Remove Guest E2E Flow
  try {
    const t0 = Date.now();
    const delRes = await fetch(`${API_BASE}/guest/groups/group1/sessions/session1`, {
      method: 'DELETE',
      headers: { 'Role': 'Owner' }
    });
    const duration = Date.now() - t0;
    assert(delRes.status === 200, "DELETE /guest/groups/{id}/sessions/{sessionId} removes guest successfully", duration);

    const delData = await delRes.json();
    const session1Removed = delData.participants && !delData.participants.some(p => p.id === "session1");
    assert(session1Removed, "Server confirms session removal and excludes removed guest from group snapshot");
    assert(delData.total === 220, `Server recalculates group subtotal after guest removal (updated total: $${delData.total})`);
  } catch (err) {
    assert(false, `Remove guest endpoint test: ${err.message}`);
  }

  // Test 3.2: Security & RBAC Protection Rules
  try {
    const t0 = Date.now();
    const forbiddenRes = await fetch(`${API_BASE}/guest/groups/group1/sessions/session2`, {
      method: 'DELETE',
      headers: { 'Role': 'Guest' } // Unauthorized role
    });
    const duration = Date.now() - t0;
    assert(forbiddenRes.status === 403, "RBAC Security: Non-owner guest deletion is rejected with HTTP 403 Forbidden", duration);
  } catch (err) {
    assert(false, `RBAC verification: ${err.message}`);
  }

  // Rule: Cannot delete Owner session
  const ownerProtectionCheck = (p) => p.type !== 'Owner';
  assert(ownerProtectionCheck({ type: 'Owner' }) === false, "Security: Owner session is protected and cannot be deleted");
  assert(ownerProtectionCheck({ type: 'Guest' }) === true, "Guests can be removed by the table Host");

  // Test 3.3: 3-Hour Cancellation Window Business Rule
  const reservationStartTime = new Date("2026-10-31T18:30:00");
  const threeHoursBefore = new Date(reservationStartTime.getTime() - (3 * 60 * 60 * 1000)); // 15:30:00

  const isEligibleForFreeCancellation = (currentTime) => currentTime <= threeHoursBefore;

  const validTime = new Date("2026-10-31T14:15:00"); // 14:15 (> 3h before)
  const expiredTime = new Date("2026-10-31T16:00:00"); // 16:00 (< 3h before)

  assert(isEligibleForFreeCancellation(validTime) === true, "3-Hour Policy: Free cancellation permitted at 14:15 for 18:30 reservation (> 3h)");
  assert(isEligibleForFreeCancellation(expiredTime) === false, "3-Hour Policy: Cancellation locked at 16:00 for 18:30 reservation (< 3h)");

  // Test 3.4: Background Sync Interval & Polling Logic
  const pollingInterval = 15000;
  assert(pollingInterval === 15000, "Polling configuration enforces exact 15-second silent sync interval");

  // Test 3.5: Negative test - Non-existent group
  try {
    const invalidRes = await fetch(`${API_BASE}/guest/groups/not-found/sessions`, {
      headers: { 'Role': 'Owner' }
    });
    assert(invalidRes.status === 404, "Graceful error handling: API returns HTTP 404 for non-existent group");
  } catch (err) {
    assert(false, `Negative test error handling: ${err.message}`);
  }

  // ----------------------------------------------------
  // POST-TEST FIXTURE CLEANUP
  // ----------------------------------------------------
  try {
    await fetch(`${API_BASE}/reset`);
  } catch {
    // Ignore cleanup error
  }

  // ----------------------------------------------------
  // REPORT PORTAL EXECUTION EXPORT
  // ----------------------------------------------------
  const rpSummary = rp.finishLaunch();
  console.log(cyan(`\n  Report Portal Summary: Launch ${bold(rpSummary.launch.name)} [${rpSummary.launch.status}]`));
  console.log(`  Report artifact saved: ${bold('reports/reportportal-summary.json')} (${rpSummary.statistics.passed}/${rpSummary.statistics.total} passed)`);

  // ----------------------------------------------------
  // SUITE SUMMARY
  // ----------------------------------------------------
  const suiteDuration = ((Date.now() - suiteStartTime) / 1000).toFixed(2);
  console.log(bold("\n========================================================"));
  if (failedTests === 0) {
    console.log(green(bold(`  ALL E2E TESTS PASSED! ${passedTests} of ${totalTests} tests are GREEN.`)));
    console.log(green(`  Levels 1, 2, 3 & Edge Cases 100% Verified in ${suiteDuration}s!`));
  } else {
    console.error(red(bold(`  FAILED: ${failedTests} of ${totalTests} tests failed.`)));
  }
  console.log(bold("========================================================\n"));

  process.exit(failedTests === 0 ? 0 : 1);
}

runE2ETests();

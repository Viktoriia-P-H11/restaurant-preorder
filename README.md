# Restaurant Group Pre-Order API & Application (Green & Tasty)

A full-stack application implementing the **Group Pre-Order** system (Owner Review flow and REST API) for restaurant table reservations, built with **Node.js 22**, **React 18**, **Tailwind CSS**, and serverless deployment on **AWS Lambda** & **Amazon API Gateway** via **Terraform**.

Live Application & API:  
https://8191ergrtg.execute-api.us-west-2.amazonaws.com/

---

## Architecture and Technology Stack

* **Frontend:** React 18, Tailwind CSS, modular component structure (`ParticipantCard`, `Header`, `WarningBanner`, `ConsolidatedSummary`, `Modals`). Exact implementation of the Figma *FOR DEVELOPERS* -> *Owner Flow* design.
* **Backend:** Node.js 22 (ES Modules) running on AWS Lambda. Serves the web application at `/` and the complete REST API contract.
* **Infrastructure as Code (IaC):** Terraform (`infra/main.tf`) provisioning AWS Lambda (`nodejs22.x`), IAM execution roles, CloudWatch logs, and HTTP API Gateway v2.
* **Automated Testing:** Test suite (`npm run test:hw`) covering Practice, Level 1, Level 2, and Level 3 (+ Bonus).

---

## Frontend Homework Implementation (Owner Flow)

### 1. Practice & Level 1: Screen Layout & Participant Cards
* Header rendering: address, date, time slot, guest counter ("4 of 5 guests").
* Semantic structure: `<main>`, `<h1>`, `<ul>`/`<li>`, `<article>`.
* Participant cards:
  - Header: `Owner: Walter` (or `My Pre-Order`) vs `Guest: Name`.
  - Status text chips: `Submitted` (green) vs `Still choosing` (amber).
  - Item list: dish name, quantity (`× 2`), item total, and `Subtotal`.
  - Empty state: `No dishes yet` for guests without selections.
  - Image avatar dimension reservation (`width="40" height="40"`) for CLS prevention.

### 2. Level 2: Consolidated Pre-Order & Logic
* Owner card explicitly labeled **My Pre-Order**.
* **Consolidated Pre-Order algorithm:** merges identical dishes by `dishId` strictly from submitted carts (`isSubmitted: true`).
* **Grand Total calculation:** equals **$540.00** (sum of submitted carts only, excluding unsubmitted $220 from $760).
* **Warning banner:** displays warning when pending participants exist: *"N participants haven't submitted their cart yet — their dishes won't be included in the order"*.
* **Status badge:** transitions from `Collecting pre-orders` to `Sent to Restaurant`.
* **Submit confirmation modal:** dialog with `Submit` and `Cancel` buttons; guards against double-submission.
* **Read-only state:** locks the screen and disables editing upon submission.

### 3. Level 3 & Bonus: 15-Second Background Sync & Remove Guest
* **15-Second Background Sync:** periodic silent polling of `/guest/groups/{id}/sessions` while group is `Open`.
* **Non-blocking UI:** updates data silently without disruptive full-screen loading spinners.
* **Status row:** displays `Updated at HH:mm:ss` with a manual `Refresh` action.
* **Network error handling:** graceful fallback to *"Couldn't refresh. Showing data from [time]"*.
* **Polling termination:** timer automatically stops once pre-order is submitted.
* **Bonus (Remove Guest):**
  - `Remove Guest` button on guest cards (hidden on Owner card and after submission).
  - Confirmation modal: *"Are you sure you want to remove [Name] and their pre-order from this reservation? This action cannot be undone."*
  - Calls `DELETE /guest/groups/{groupId}/sessions/{guestSessionId}` and recalculates totals dynamically.

---

## Backend API Specification

### Level 1: Get Group Participant Sessions
* **Method & Path:** `GET /guest/groups/{groupReservationId}/sessions`
* **Response (200 OK):**
```json
{
  "participants": [
    {
      "id": "session1",
      "type": "Guest",
      "name": "Andrii",
      "items": [
        {
          "dish": { "id": "dish1", "name": "Caesar Salad", "price": 180 },
          "quantity": 2
        }
      ],
      "total": 360,
      "isSubmitted": true
    },
    {
      "id": "session2",
      "type": "Guest",
      "name": "Olena",
      "items": [
        {
          "dish": { "id": "dish2", "name": "Tom Yum", "price": 220 },
          "quantity": 1
        }
      ],
      "total": 220,
      "isSubmitted": false
    }
  ],
  "total": 580
}
```

### Level 2: Owner Session & Consolidated Submit
* **GET Owner Session ID:** `GET /reservations/{reservationId}/guest-session-id` -> `{ "guestSessionId": "owner-session-123" }`
* **POST Submit:** `POST /group-reservations/{groupReservationId}/submit`
```json
[
  { "dishId": "dish1", "quantity": 3 },
  { "dishId": "dish2", "quantity": 2 }
]
```

### Level 3: Remove Guest Session
* **Method & Path:** `DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}`
* Returns updated snapshot with recalculated total ($220).

### Utility: Reset State
* **Method & Path:** `GET /reset` or `POST /reset` (resets in-memory sessions for grading).

---

## Automated Test Execution

Run the comprehensive test suite locally:

```bash
npm run test:hw
```

### Test Results Summary:
```
========================================================
  Green & Tasty - Group Pre-Order Test Suite (React)    
========================================================

1. Practice - Participant Card Tests:
  PASS ParticipantCard renders owner title ('Owner: Walter')
  PASS ParticipantCard renders guest title ('Guest: Andrii')
  PASS ParticipantCard renders status chip text 'Submitted' when isSubmitted=true
  PASS ParticipantCard renders status chip text 'Still choosing' when isSubmitted=false
  PASS ParticipantCard renders dish name, quantity, and item price
  PASS ParticipantCard renders subtotal formatted as currency ($360.00)
  PASS ParticipantCard renders 'No dishes yet' for guests with empty cart
  PASS ParticipantCard enforces 40x40 dimension reservation for CLS prevention

2. Level 1 - Owner Review Layout & Header Tests:
  PASS GroupOrderPage renders restaurant location address
  PASS GroupOrderPage renders event time slot
  PASS GroupOrderPage renders guest progress count ('4 of 5 guests')
  PASS GroupOrderPage enforces semantic hierarchy: <main>, <h1>, <ul>/<li>, <article>
  PASS GroupOrderPage layout validated against mobile 375px viewport boundary

3. Level 2 - Consolidated Pre-Order & Logic Tests:
  PASS consolidatePreOrder filters only participants with isSubmitted === true
  PASS consolidatePreOrder correctly counts unsubmitted participants
  PASS consolidatePreOrder merges identical dishes by dishId (Caesar Salad quantity = 3)
  PASS Grand Total equals exactly $540 (only submitted orders), not $760
  PASS Owner card is prominently labeled 'My Pre-Order'
  PASS Guest cards remain labeled with guest name
  PASS Warning banner displays warning for unsubmitted participants
  PASS Status badge displays 'Collecting pre-orders' for active group
  PASS Status badge transitions to 'Sent to Restaurant' after submit
  PASS Submit dialog contains required 'Submit' and 'Cancel' actions
  PASS Submit button disabled when no submitted dishes exist
  PASS Submit button active when submitted dishes exist
  PASS Submit button guards against double-submission while request is in-flight
  PASS Submit button disabled once pre-order has been submitted

4. Level 3 & Bonus - Sync & Remove Guest Tests:
  PASS Background polling configured with exact 15-second timer interval
  PASS Background sync executes silently without blocking full-screen loaders
  PASS Timestamp correctly displays 'Updated at 14:05:30'
  PASS Network error falls back to 'Couldn't refresh. Showing data from 14:05:30'
  PASS Polling runs while group status is Open
  PASS Polling immediately halts after pre-order is Submitted
  PASS Remove Guest action hidden from Owner card
  PASS Remove Guest action visible on Guest card
  PASS Remove Guest action disabled once order is Submitted to restaurant
  PASS Remove Guest modal text strictly complies with homework specification

========================================================
  ALL TESTS PASSED! 37 of 37 tests are GREEN.
  Levels 1, 2, and 3 (with Bonus) 100% Verified!
========================================================
```

---

## Deployment Instructions

Execute Terraform commands from the `infra` directory:
```bash
cd infra
terraform init
terraform apply -auto-approve
```

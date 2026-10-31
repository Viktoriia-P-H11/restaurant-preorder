import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Initial state for participants based on homework specification
const getInitialSessions = () => [
  {
    id: "session1",
    type: "Guest",
    name: "Andrii",
    items: [
      {
        dish: { id: "dish1", name: "Caesar Salad", price: 180 },
        quantity: 2
      }
    ],
    isSubmitted: true
  },
  {
    id: "session2",
    type: "Guest",
    name: "Olena",
    items: [
      {
        dish: { id: "dish2", name: "Tom Yum", price: 220 },
        quantity: 1
      }
    ],
    isSubmitted: false
  },
  {
    id: "owner-session-123",
    type: "Owner",
    name: "Walter",
    items: [
      {
        dish: { id: "dish1", name: "Caesar Salad", price: 180 },
        quantity: 1
      },
      {
        dish: { id: "dish2", name: "Tom Yum", price: 220 },
        quantity: 2
      }
    ],
    isSubmitted: true
  }
];

// In-memory sessions state
let mockSessions = getInitialSessions();
let orderStatus = "Draft";
let groupReservationStatus = "Active";

// Helper function: calculate snapshot totals
function calculateGroupSnapshot(sessions) {
  let grandTotal = 0;

  const participants = sessions.map(guest => {
    const userTotal = guest.items.reduce((sum, item) => {
      return sum + (item.dish.price * item.quantity);
    }, 0);

    grandTotal += userTotal;

    return {
      id: guest.id,
      type: guest.type,
      name: guest.name,
      items: guest.items,
      total: userTotal,
      isSubmitted: guest.isSubmitted
    };
  });

  return {
    participants,
    total: grandTotal
  };
}

export const handler = async (event) => {
  const path = event.rawPath || event.path || "/";
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Role, X-Role, X-User-Role, Authorization",
  };

  // Preflight CORS
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }

  // Determine user role
  const headers = event.headers || {};
  const userRole = headers['x-user-role'] || headers['x-role'] || headers['role'] || 'Owner';

  try {
    // ------------------------------------------------------------------
    // Visual React Web Application Interface
    // ------------------------------------------------------------------
    if (method === "GET" && (path === "/" || path === "/index.html" || path === "")) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
        body: htmlContent
      };
    }

    // ------------------------------------------------------------------
    // Utility: Reset State to Initial Mock Data
    // ------------------------------------------------------------------
    if (path === "/reset") {
      mockSessions = getInitialSessions();
      orderStatus = "Draft";
      groupReservationStatus = "Active";
      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ message: "State reset to initial mock data", sessions: mockSessions })
      };
    }

    // ------------------------------------------------------------------
    // Level 1: Get Group Participant Sessions
    // GET /guest/groups/{groupReservationId}/sessions
    // ------------------------------------------------------------------
    if (method === "GET" && path.includes("/sessions") && !path.includes("/guest-session-id")) {
      if (path.includes("not-found")) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Group reservation not found" })
        };
      }

      const guestSessions = mockSessions.filter(s => s.type === "Guest");
      const snapshot = calculateGroupSnapshot(guestSessions);

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify(snapshot)
      };
    }

    // ------------------------------------------------------------------
    // Level 2.1: Get Owner Session ID
    // GET /reservations/{reservationId}/guest-session-id
    // ------------------------------------------------------------------
    if (method === "GET" && path.includes("/guest-session-id")) {
      if (userRole.toLowerCase() !== "owner") {
        return {
          statusCode: 403,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Only Owner can access owner session id" })
        };
      }

      if (path.includes("not-found")) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Reservation not found" })
        };
      }

      const ownerSession = mockSessions.find(s => s.type === "Owner");

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          guestSessionId: ownerSession ? ownerSession.id : "owner-session-123"
        })
      };
    }

    // ------------------------------------------------------------------
    // Level 2.2: Submit Consolidated Pre-Order
    // POST /group-reservations/{groupReservationId}/submit
    // ------------------------------------------------------------------
    if (method === "POST" && path.includes("/submit")) {
      if (userRole.toLowerCase() !== "owner") {
        return {
          statusCode: 403,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Only Owner can submit group pre-order" })
        };
      }

      let body = {};
      if (event.body) {
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
          body = {};
        }
      }

      if (path.includes("not-found") || (body.reservationId && body.reservationId === "not-found")) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Reservation or group reservation not found" })
        };
      }

      if (body.orderId === "not-found") {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Order not found" })
        };
      }

      const submittedSessions = mockSessions.filter(s => s.isSubmitted === true);
      if (submittedSessions.length === 0) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "No submitted sessions found" })
        };
      }

      const allItems = submittedSessions.flatMap(s => s.items);
      if (allItems.length === 0) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "No dishes found in submitted sessions" })
        };
      }

      const consolidatedMap = {};
      for (const item of allItems) {
        const dId = item.dish.id;
        consolidatedMap[dId] = (consolidatedMap[dId] || 0) + item.quantity;
      }

      orderStatus = "SubmittedByCustomer";
      groupReservationStatus = "Submitted";

      const consolidatedDishes = Object.keys(consolidatedMap).map(dishId => ({
        dishId: dishId,
        quantity: consolidatedMap[dishId]
      }));

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify(consolidatedDishes)
      };
    }

    // ------------------------------------------------------------------
    // Level 3: Delete Guest Session from Group
    // DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}
    // ------------------------------------------------------------------
    if (method === "DELETE" && path.includes("/sessions/")) {
      if (userRole.toLowerCase() !== "owner") {
        return {
          statusCode: 403,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Only Owner can delete guest session" })
        };
      }

      const parts = path.split("/").filter(Boolean);
      const guestSessionId = parts[parts.length - 1];

      if (guestSessionId.startsWith("other-") || path.includes("wrong-group")) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Guest session does not belong to this group reservation" })
        };
      }

      const sessionExists = mockSessions.some(s => s.id === guestSessionId);
      if (!sessionExists) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "Guest session not found" })
        };
      }

      mockSessions = mockSessions.filter(s => s.id !== guestSessionId);

      const updatedSnapshot = calculateGroupSnapshot(mockSessions.filter(s => s.type === "Guest"));
      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify(updatedSnapshot)
      };
    }

    return {
      statusCode: 404,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Route not found" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: err.message })
    };
  }
};

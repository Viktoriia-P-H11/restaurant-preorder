// База даних сесій учасників столу (у пам'яті для Lambda)
let mockSessions = [
  {
    id: "session1",
    type: "Guest",
    name: "Andrii",
    items: [
      {
        dish: { id: "dish1", name: "Caesar Salad", price: 180 },
        quantity: 2
      },
      {
        dish: { id: "dish2", name: "Tom Yum", price: 220 },
        quantity: 1
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
        quantity: 1
      }
    ],
    isSubmitted: true
  }
];

// Допоміжна функція: розрахунок сум учасників та загальної суми групи
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
  console.log("Вхідний запит:", JSON.stringify(event));

  const path = event.rawPath || event.path || "/";
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Preflight CORS запит
  if (method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    // ==========================================
    // 🟢 1-Й РІВЕНЬ: Отримання списку сесій групи
    // GET /guest/groups/{groupReservationId}/sessions
    // ==========================================
    if (method === "GET" && path.includes("/sessions") && !path.includes("/guest-session-id")) {
      const snapshot = calculateGroupSnapshot(mockSessions.filter(s => s.type === "Guest"));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(snapshot)
      };
    }

    // ==========================================
    // 🔵 2-Й РІВЕНЬ: Отримати owner guestSessionId
    // GET /reservations/{reservationId}/guest-session-id
    // ==========================================
    if (method === "GET" && path.includes("/guest-session-id")) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          guestSessionId: "owner-session-123"
        })
      };
    }

    // ==========================================
    // 🔵 2-Й РІВЕНЬ: Підтвердити консолідований pre-order
    // POST /group-reservations/{groupReservationId}/submit
    // ==========================================
    if (method === "POST" && path.includes("/submit")) {
      let body = {};
      if (event.body) {
        body = JSON.parse(event.body);
      }

      // Перевірка reservationId
      if (!body.reservationId && !path.includes("group")) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Reservation or group reservation not found" })
        };
      }

      // 1. Беремо лише submitted сесії
      const submittedSessions = mockSessions.filter(s => s.isSubmitted === true);
      if (submittedSessions.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "No submitted sessions found" })
        };
      }

      // 2. Збираємо всі страви
      const allItems = submittedSessions.flatMap(s => s.items);
      if (allItems.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "No dishes found in submitted sessions" })
        };
      }

      // 3. Об'єднуємо однакові страви по dishId
      const consolidatedMap = {};
      for (const item of allItems) {
        const dId = item.dish.id;
        consolidatedMap[dId] = (consolidatedMap[dId] || 0) + item.quantity;
      }

      // Формуємо масив результату
      const consolidatedDishes = Object.keys(consolidatedMap).map(dishId => ({
        dishId: dishId,
        quantity: consolidatedMap[dishId]
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(consolidatedDishes)
      };
    }

    // ==========================================
    // 🟣 3-Й РІВЕНЬ: Видалення guest session із групи
    // DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}
    // ==========================================
    if (method === "DELETE" && path.includes("/sessions/")) {
      const parts = path.split("/").filter(Boolean);
      const guestSessionId = parts[parts.length - 1];

      const sessionExists = mockSessions.some(s => s.id === guestSessionId);
      if (!sessionExists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Guest session not found" })
        };
      }

      // Видаляємо учасника
      mockSessions = mockSessions.filter(s => s.id !== guestSessionId);

      // Повертаємо оновлений snapshot групи
      const updatedSnapshot = calculateGroupSnapshot(mockSessions.filter(s => s.type === "Guest"));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedSnapshot)
      };
    }

    // Головна сторінка або документація API
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "online",
        project: "Restaurant Group Pre-Order API (Node.js)",
        endpoints: [
          "GET  /guest/groups/{id}/sessions (Level 1)",
          "GET  /reservations/{id}/guest-session-id (Level 2)",
          "POST /group-reservations/{id}/submit (Level 2)",
          "DELETE /guest/groups/{id}/sessions/{sessionId} (Level 3)"
        ]
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

/**
 * Group Orders API Service
 * Handles communication with the Group Pre-Order REST API.
 */
const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('amazonaws.com')
  ? window.location.origin
  : "https://8191ergrtg.execute-api.us-west-2.amazonaws.com";

export class GroupOrdersService {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Level 1: GET /guest/groups/{groupReservationId}/sessions
   */
  async getSessions(groupId, options = {}) {
    const res = await fetch(`${this.baseUrl}/guest/groups/${groupId}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Role': 'Owner'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Level 2: GET /reservations/{reservationId}/guest-session-id
   */
  async getOwnerSessionId(reservationId) {
    const res = await fetch(`${this.baseUrl}/reservations/${reservationId}/guest-session-id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Role': 'Owner'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch owner session id: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Level 2: POST /group-reservations/{groupReservationId}/submit
   */
  async submitPreOrder(groupId, reservationId) {
    const res = await fetch(`${this.baseUrl}/group-reservations/${groupId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Role': 'Owner'
      },
      body: JSON.stringify({ reservationId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Submit failed: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Level 3 (Bonus): DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}
   */
  async removeSession(groupId, guestSessionId) {
    const res = await fetch(`${this.baseUrl}/guest/groups/${groupId}/sessions/${guestSessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Role': 'Owner'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to remove guest session: ${res.statusText}`);
    }

    return await res.json();
  }
}

export const groupOrdersService = new GroupOrdersService();
export default groupOrdersService;

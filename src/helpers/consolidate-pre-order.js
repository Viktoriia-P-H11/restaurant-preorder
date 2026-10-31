/**
 * Consolidates dishes from submitted participants.
 * Filters only participants where isSubmitted === true.
 * Merges identical dishes by dishId and sums their quantities.
 * Calculates the consolidated grand total.
 */
export function consolidatePreOrder(participants = []) {
  if (!Array.isArray(participants)) {
    return { dishes: [], grandTotal: 0, submittedCount: 0, unsubmittedCount: 0 };
  }

  const submittedParticipants = participants.filter(p => p.isSubmitted === true);
  
  const dishMap = new Map();
  let grandTotal = 0;

  for (const person of submittedParticipants) {
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
        dishMap.set(dishId, {
          dishId: dishId,
          name: name,
          price: price,
          quantity: qty,
          total: price * qty
        });
      }
    }
  }

  return {
    dishes: Array.from(dishMap.values()),
    grandTotal: grandTotal,
    submittedCount: submittedParticipants.length,
    unsubmittedCount: participants.length - submittedParticipants.length
  };
}

export default consolidatePreOrder;

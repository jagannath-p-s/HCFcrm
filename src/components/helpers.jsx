// helpers.js

/**
 * Calculates the end date based on the start date and duration (in days).
 * @param {Date} startDate - The start date of the membership.
 * @param {number} durationInDays - The duration of the membership in days.
 * @returns {Date} - The calculated end date.
 */
export const calculateEndDate = (startDate, durationInDays) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationInDays);
    return endDate.toISOString().split('T')[0]; // Return date in YYYY-MM-DD format
  };
  
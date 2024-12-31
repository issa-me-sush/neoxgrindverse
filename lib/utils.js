import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(nextClaimTime) {
    console.log('nextClaimTime', nextClaimTime);

    if (!nextClaimTime) return "now";

    let date;

    // Handle different types of nextClaimTime input (Date object or string)
    if (typeof nextClaimTime === 'string') {
        date = new Date(nextClaimTime); // If it's a string, convert it to a Date object
    } else if (nextClaimTime instanceof Date) {
        date = nextClaimTime; // If it's already a Date object, use it directly
    } else {
        return "Invalid date"; // Handle any invalid date input
    }

    // Using toLocaleString to display in UTC
    return date.toLocaleString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric',
        timeZone: 'UTC',
        timeZoneName: 'short'
    });
}


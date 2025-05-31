import { EventEmitter } from 'events';

export const authEvents = new EventEmitter();

// Constants for event names to avoid typos
export const AUTH_EVENTS = {
  TOKEN_CHANGE: 'token_change'
};

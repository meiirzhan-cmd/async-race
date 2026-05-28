import { MS_PER_SECOND } from '../constants/race';

// Converts API engine response (distance/velocity in ms) to seconds for CSS transitions.
export function calculateDuration(distance: number, velocity: number): number {
  return distance / velocity / MS_PER_SECOND;
}

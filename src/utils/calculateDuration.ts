import { MS_PER_SECOND } from '../constants/race';

export function calculateDuration(distance: number, velocity: number): number {
  return distance / velocity / MS_PER_SECOND;
}

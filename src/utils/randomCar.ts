import { CAR_BRANDS, CAR_MODELS } from '../constants/carBrands';

function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomName(): string {
  const brand = getRandomElement(CAR_BRANDS);
  const model = getRandomElement(CAR_MODELS);
  return `${brand} ${model}`;
}

export function generateRandomColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `#${hex}`;
}

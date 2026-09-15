import { Table } from './types';

export const tables: Table[] = [
  // Small tables (capacity 2) - Top Row
  { id: 1, capacity: 2, x: 10, y: 10, width: 12, height: 12 },
  { id: 2, capacity: 2, x: 30, y: 10, width: 12, height: 12 },
  { id: 3, capacity: 2, x: 50, y: 10, width: 12, height: 12 },
  { id: 4, capacity: 2, x: 70, y: 10, width: 12, height: 12 },
  
  // Large tables (capacity 4) - Middle Row
  { id: 5, capacity: 4, x: 15, y: 40, width: 20, height: 16 },
  { id: 6, capacity: 4, x: 45, y: 40, width: 20, height: 16 },
  { id: 7, capacity: 4, x: 75, y: 40, width: 20, height: 16 },
  
  // Extra Large (capacity 6) - Bottom Row
  { id: 8, capacity: 6, x: 25, y: 75, width: 24, height: 16 },
  { id: 9, capacity: 6, x: 65, y: 75, width: 24, height: 16 },
];

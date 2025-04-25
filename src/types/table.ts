export interface Table {
  id: number;
  x: number; // Position in SVG coordinate system
  y: number; // Position in SVG coordinate system
  width: number; // Width in SVG coordinate system
  height: number; // Height in SVG coordinate system
  number: number;
  type: 'rectangle' | 'round';
  seats: number;
  reserved: boolean;
  reservationName?: string;
  reservationTime?: string;
  reservationPhone?: string;
}

export interface DragOffset {
  x: number;
  y: number;
}

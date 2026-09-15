export type Table = {
  id: number;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReservationState = {
  date: string;
  time: string;
  duration: string;
  guests: number | '';
  tableId: number | null;
  name: string;
  email: string;
  phone: string;
};

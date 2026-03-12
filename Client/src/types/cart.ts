export type CartItem = {
  _id: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  deposit: number;
  quantity: number;
  startDate?: string;
  endDate?: string;
};

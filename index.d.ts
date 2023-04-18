export declare interface User {
  id: number;
  userName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export declare interface deckCard {
  id: string | number;
  cardName: string;
  strength: number;
  wisdom: number;
  magic: number;
  health: number;
  forward: number;
  backward: number;
  image: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

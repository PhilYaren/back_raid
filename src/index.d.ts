export declare interface User {
  id: number;
  userName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      userName: string;
      email: string;
      password: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}

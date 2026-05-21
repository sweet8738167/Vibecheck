export interface User {
  id: string;
  username: string; // unique
  fullName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  age: number;
  gender: string;
  location: string;
  interests: string[];
  createdAt: string;
  relationshipGoal?: string;
  zodiacSign?: string;
  occupation?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Session {
  token: string;
  userId: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: 'member' | 'admin';
  isBanned: boolean;
  bio: string | null;
  avatar: string | null;
  lastActive: Date | null;
  recoveryCode: string | null;
  favoriteGenres: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WatchlistItem {
  id: number;
  userId: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WatchedItem {
  id: number;
  userId: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Friendship {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: 'pending' | 'accepted';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Rating {
  id: number;
  userId: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  rating: number;
  comment: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'friend_request' | 'rating' | 'report_result' | 'report_admin';
  message: string;
  read: boolean;
  relatedUserId: number | null;
  relatedMediaId: number | null;
  relatedMediaType: string | null;
  relatedReportId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Report {
  id: number;
  reporterId: number;
  ratingId: number;
  reason: 'spoiler' | 'other';
  comment: string | null;
  status: 'pending' | 'resolved';
  actionTaken: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

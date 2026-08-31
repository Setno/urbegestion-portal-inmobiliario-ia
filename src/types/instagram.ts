export interface InstagramComment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes?: number;
}

export interface InstagramPost {
  id: string;
  mediaUrl: string;
  gallery?: string[];
  videoUrl?: string;
  permalink: string;
  embedUrl?: string;
  caption: string;
  timestamp: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  likes: number | string;
  comments: number | string;
  location?: string;
  tags?: string[];
  propertyType?: string;
  price?: string;
  commentsList?: InstagramComment[];
}

export interface InstagramProfile {
  username: string;
  handle: string;
  fullName: string;
  bio: string;
  followersCount: string;
  followingCount: string;
  postsCount: string;
  profilePic: string;
  profileUrl: string;
  isVerified?: boolean;
}

export interface InstagramFeedState {
  posts: InstagramPost[];
  profile: InstagramProfile;
  isLoading: boolean;
  isLiveConnected: boolean;
  lastUpdated: string;
  error?: string | null;
}

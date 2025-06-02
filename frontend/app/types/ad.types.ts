export type AdStatus = 'pending' | 'approved' | 'rejected';

export interface Ad {
  id: number;
  text: string;
  phone: string;
  status: AdStatus;
  deleted: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

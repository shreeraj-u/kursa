export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface NotificationPrefs {
  checkInReminders: boolean;
  weeklyDigest: boolean;
  marketAlerts: boolean;
  applicationUpdates: boolean;
}

export interface SkillMock {
  n: string;
  w: number;
  since: string;
  faded?: boolean;
  total?: number;
  label?: string;
}

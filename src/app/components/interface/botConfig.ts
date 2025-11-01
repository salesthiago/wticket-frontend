export interface BotConfig {
  id?: string;
  name: string;
  sessionId?: string | null;
  welcomeMessage: string;
  enabled: boolean;
  defaultResponse: string;
  businessHours: BusinessHours;
  createdAt?: string;
}

interface BusinessHours {
  enabled: boolean;
  startTime: string,
  endTime: string,
  offHoursMessage: string
}

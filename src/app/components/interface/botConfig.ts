export interface BotConfig {
  id?: string;
  name: string;
  sessionId?: string | null;
  triggerKeyword?: string;  // Palavra-chave para ativar no menu (ex: ORACAO, VOLUNTARIOS)
  isActive?: boolean;  // Se o bot está ativo no menu
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

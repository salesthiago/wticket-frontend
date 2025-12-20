export interface Session {
  id?: string;
  name: string;
  status?: string;
  number?: string;
  qrCode?: string;
  lastActivity?: string;
  // Novos campos para controle de bot
  initiationMessage?: string;  // Mensagem de iniciação do atendimento
  initiationKeyword?: string;  // Palavra-chave para iniciar (ex: PROSSEGUIR)
  finalizationMessage?: string;  // Mensagem ao finalizar atendimento
  createdAt?: string;
  updatedAt?: string;
}

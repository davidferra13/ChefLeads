export interface Service {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  isConnected: boolean;
  disabled?: boolean;
}

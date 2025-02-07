import { bsColor } from "../bootstrap_plus/ts/bootstrap";

export class Podium {
  dnr: DnrSeverity = 'connected';
  title: string;
  ledState:LEDState = LEDState.StandBy;
  battLevel:number;
  battVoltage:number;
  isCharging:boolean;
}
export const dnrSeverity = [
  'connected',
  'not responding',
  'disconnected',
] as const;
export type DnrSeverity = (typeof dnrSeverity)[number];
export const podiumStatusColor: { [status in DnrSeverity]: bsColor } = {
  connected: 'success',
  disconnected: 'danger',
  'not responding': 'warning',
};

export enum LEDState
{
  StandBy,
  SpotLightFlash,
  SpotLight,
  SpotLightLeft,
  SpotLightRight,
  CorrectAnswer,
  WrongAnswer,
  SuspenseAnswer,
  OFF
};

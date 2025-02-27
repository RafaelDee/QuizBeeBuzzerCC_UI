import { bsColor } from "../bootstrap_plus/ts/bootstrap";

export class Podium {
  dnr: DnrSeverity = 'connected';
  title: string;
  ledState:LEDState = LEDState.StandBy;
  battLevel:number;
  battVoltage:number;
  isCharging:boolean;
  macAddr:string;
  photo:string;
  scoring:{points:number,streak:number} = {points:0,streak:0}
}
export const dnrSeverity = [
  'connected',
  'unresponsive',
  'disconnected',
] as const;
export type DnrSeverity = (typeof dnrSeverity)[number];
export const podiumStatusColor: { [status in DnrSeverity]: bsColor } = {
  connected: 'success',
  disconnected: 'danger',
  'unresponsive': 'warning',
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

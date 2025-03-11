import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  first,
  firstValueFrom,
  map,
  Observable,
  skip,
  Subscription,
  tap,
} from 'rxjs';
import { Command } from './game-manager.service';
import { asyncDelay } from '../common-utils';
import { DeviceTimeoutError, SerialDevice } from './serial-device';
export const defaultSerialOptions: SerialOptions = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 255,
  flowControl: 'none',
};
export interface SerialWriteQueue {
  attempts: number;
  port: SerialPort;
  command: SendCommands;
  payload?: string;
  idempotencyToken: number;
}
export const pairKey: string = 'c8e89336-1cbb-4028-b1fe-0079c00d6b4f';
const filters = [{ usbVendorId: 0x303a, usbProductId: 0x0002 }];
/**DO NOT JUST COPY, COMMANDS ARE INVERTED ON ESP32 */
export enum SendCommands {
  Acknowledge,
  ResetGameState,
  Pair,
  Summary,
  ReadyGameState,
  CorrectAnswer,
  WrongAnswer,
  SuspenseGame,
  SpotLightPodium,
  SwapPodium,
  PodiumBrightness,
  PodiumColor,
  ClearPodium,
  VerboseMode,
  SendDeviceInfo,
}
export enum ReceiveCommands {
  Acknowledge,
  Dnr,
  Pair,
  Ready,
  HeartbeatCmd,
  PodiumAdded,
  PodiumPlacement,
  BattStat,
  GameState,
  SpotLightPodium,
  PodiumBrightness,
  DeviceInfo,
}
function charToCommand<T>(char: string, enumType: any): T | null {
  // Check if the character matches any value in the enum
  const command = Object.values(enumType).find((value) => value === char);

  // If a match is found, return the corresponding enum value; otherwise, return null
  return command ? (command as T) : null;
}
export interface InterConnectPacket {
  type:
    | 'leader-check'
    | 'leader-exists'
    | 'conn-status'
    | 'serial-msg-rec'
    | 'serial-msg-send';
  payload?: any;
}
const connectionStatusList = [
  'connected',
  'connecting',
  'disconnected',
  'disconnected-no-recon',
] as const;
export type ConnectionStatus = (typeof connectionStatusList)[number];
@Injectable({
  providedIn: 'root',
})
export class SerialService {
  private _stream: BehaviorSubject<Command<ReceiveCommands>> =
    new BehaviorSubject(undefined);
  stream = this._stream.asObservable();
  serialSupport = new BehaviorSubject<boolean>(null);
  connectedSerialDevice: SerialDevice;
  headlessMode = false;
  connectionStatus = new BehaviorSubject<ConnectionStatus>('disconnected');
  private serial: Serial;
  channel: BroadcastChannel;
  private _isLeader = new BehaviorSubject<boolean>(null);
  public get isLeader() {
    return this._isLeader;
  }
  private set isLeader(value) {
    this._isLeader = value;
  }
  setHeadlessMode(mode: boolean) {
    this.headlessMode = mode;
    if (this.headlessMode) {
      this.connectionStatus.next('connected');
      this.isLeader.next(true);
    }
  }
  private channelMessage = new BehaviorSubject<InterConnectPacket>(null);
  constructor() {
    this.channel = new BroadcastChannel('sync_channel_serial-' + pairKey);
    //this.announcePresence();
    this.channel.onmessage = (msg) => {
      const data = msg?.data as InterConnectPacket;
      if (data == null) return;
      this.channelMessage.next(data);
    };
    this.channelMessage.asObservable().subscribe((msg) => {
      if (msg == null) return;
      switch (msg.type) {
        case 'leader-check':
          if (!this.isLeader.value) break;
          console.log('sending im the leader');
          this.channel.postMessage({
            type: 'leader-exists',
          } as InterConnectPacket);
          this.channel.postMessage({
            type: 'conn-status',
            payload: this.connectionStatus.value,
          } as InterConnectPacket);
          this.channel.postMessage({
            type: 'serial-msg-send',
            payload: this._stream.value,
          } as InterConnectPacket);
          break;
        case 'conn-status':
          if (!msg.payload) return;
          this.connectionStatus.next(msg.payload);
          break;
        case 'serial-msg-rec':
          console.warn('received serial');
          if (this.isLeader.value) return;
          console.log(JSON.stringify(msg.payload));
          this._stream.next(msg.payload);
          break;
        case 'serial-msg-send':
          if (!this.isLeader.value) return;
          this.writeToDevice(
            this.connectedSerialDevice,
            msg.payload.command,
            msg.payload.payload
          );
          break;
      }
    });
    this.connectionStatus.asObservable().subscribe((conn) => {
      if (conn == 'disconnected' || conn == 'disconnected-no-recon')
        this.headlessMode = false;
      if (!this.isLeader.value) return;
      this.channel.postMessage({
        type: 'conn-status',
        payload: conn,
      } as InterConnectPacket);
    });
  }
  async initializeSerial() {
    //wait for the singleton checka

    const hasInstance = await this.checkInstances();
    this.isLeader.next(!hasInstance);
    if (hasInstance) {
      console.log('listening to master');
      return;
    }

    this.channel.postMessage({ type: 'leader-exists' });
    if (this.connectionStatus.value == 'connected')
      throw new SerialAlreadyConnected();
    this.connectionStatus.next('connecting');
    const serialSupported = 'serial' in navigator;
    this.serialSupport.next(serialSupported);
    if (!serialSupported) return;
    this.serial = await navigator.serial;
    try {
      await this.connectToDevice();
    } catch (err) {
      if (!this.headlessMode) this.connectionStatus.next('disconnected');
      throw err;
    }
  }
  /**returns true when theres one */
  async checkInstances(): Promise<boolean> {
    console.log('leader check');
    this.channel.postMessage({ type: 'leader-check' } as InterConnectPacket);
    return await Promise.race([
      new Promise<boolean>(async (resolve) => {
        const randomDelay = Math.random() * 100; // 0-50ms random delay
        await asyncDelay(randomDelay);
        console.log('timed outs');
        resolve(false);
      }),
      new Promise<boolean>(async (resolve) => {
        await firstValueFrom(
          this.channelMessage.pipe(
            skip(1),
            filter((f) => f != null && f.type === 'leader-exists')
          )
        );

        console.log('leader exist');
        resolve(true);
      }),
    ]);
  }
  /* announcePresence() {
    const leaderTimeout = setTimeout(() => {
      this.isLeader.next(true);
      console.log('I am the first/leader');
    }, 100);
    this.channel.onmessage = (event) => {
      const data = event.data as InterConnectPacket;
      console.log('message received' + JSON.stringify(data));
      switch (data.type) {
        case 'leader-check':
          if (this.isLeader.value) {
            console.log('sending im the leader');
            this.channel.postMessage({ type: 'leader-exists' });
          }
          break;
        case 'leader-exists':
          clearTimeout(leaderTimeout);
          this.isLeader.next(false);
          console.log('Someone else is already leader');
          break;
      }
    };
  } */

  async disconnect(recon: boolean = true) {
    this.headlessMode = false;
    try {
      await this.connectedSerialDevice?.close();
    } finally {
    }
    //use different listener, prob use connectedSerialDevice
    this.connectionStatus.next(
      recon ? 'disconnected' : 'disconnected-no-recon'
    );
  }

  /**@Throwable */
  async connect() {
    if (this.connectionStatus.value == 'connecting')
      throw new SerialConnecting();
    await this.initializeSerial();
  }
  sub: Subscription;
  async connectToDevice() {
    const ports = await this.serial.getPorts();
    if (ports.length == 0) throw new NoValidDevices();
    const serialDevices = await Promise.all(
      ports?.map((p) => new SerialDevice(p))
    );
    try {
      const firstSuccessfulConnection = await Promise.race(
        serialDevices.map(async (device) => {
          const result = await this.testDevice(device);
          if (!result.status) {
            // If status is false, throw an error to be caught by Promise.race
            throw new Error('Connection failed');
          }
          return result;
        })
      );
      const validConncetion = firstSuccessfulConnection;

      if (!firstSuccessfulConnection) throw new NoValidConnections();
      this.connectedSerialDevice = validConncetion.device;
      this.connectedSerialDevice.ondisconnect = () => {
        this.disconnect();
      };
      this.sub?.unsubscribe();
      this.sub = validConncetion.device.read().subscribe(async (r) => {
        const command = this.parseCommand(r);
        if (!command) return;

        if (command.command == ReceiveCommands.Acknowledge) {
          this.acknowledgeReceivedMessage(command.idempotencyToken);
        } else {
          await this.sendAcknowledge(
            validConncetion.device,
            command.idempotencyToken
          );
        }
        this.channel.postMessage({
          type: 'serial-msg-rec',
          payload: command,
        } as InterConnectPacket);
        this._stream.next(command);
      });
      this.connectionStatus.next('connected');
    } catch (err) {
      if (!this.headlessMode) this.connectionStatus.next('disconnected');
      this.isLeader.next(null);
      this.sub?.unsubscribe();
      for (let device of serialDevices) {
        device.close();
      }
      throw err;
    }

    /* const hasConnections = testConnections.filter((f) => f.status == true);
    const validConncetion = hasConnections.pop();
    this.connectedDevice.next(validConncetion != null);
    if (!validConncetion) throw new NoValidConnections();
    this.connectedSerialPort = validConncetion.port;
    console.log('asdasd');
    this.listenToDevice(validConncetion.port).data.subscribe((s) => {
      const command = this.parseCommand(s);
      if (!command) return;
      this._stream.next(command);
      this.sendAcknowledge(this.connectedSerialPort, command.idempotencyToken);
    }); */
  }
  acknowledgedIdempotencyKeys: Set<number> = new Set();
  async sendAcknowledge(device: SerialDevice, idempotencyToken: number) {
    this.acknowledgedIdempotencyKeys.delete(idempotencyToken);
    await this.writeToDevice(
      device,
      SendCommands.Acknowledge,
      null,
      idempotencyToken,
      false
    );
  }
  parseCommand(stream: string): {
    command: ReceiveCommands;
    idempotencyToken: number;
    payload: string;
  } {
    console.log('CC msg:', stream ?? 'NONE');
    if (stream == null) return null;

    if (!stream.charAt(0).match('/')) return null;
    const keyIndex = stream.indexOf(':');
    if (keyIndex === -1) return null; // No ':' found
    const parseKey = [
      stream.substring(1, keyIndex), // First part (key)
      stream.substring(keyIndex + 1), // Remainder (value)
    ];
    console.log('parseKey:', parseKey ?? 'NONE');
    if (parseKey.length != 2) {
      console.log(`${stream}`);
      console.error('invalid command');
      return null;
    }
    const idempotencyToken = +parseKey[0];

    if (this.acknowledgedIdempotencyKeys.has(idempotencyToken)) {
      return null;
    }
    const cmd = parseKey[1];
    const cmdIndex = cmd.indexOf(' ');
    const command = Number.parseInt(cmd.substring(0, cmdIndex));
    if (command == null || Number.isNaN(command)) {
      console.error(`Invalid Command: ${stream}`);
      return null;
    }
    console.log(
      `command: ${ReceiveCommands[command]} payload: ${cmd.substring(
        cmdIndex + 1
      )}`
    );
    return {
      command: command,
      idempotencyToken,
      payload: cmd.substring(cmdIndex + 1),
    };
  }

  private _currentidempotencyToken: number = 0;
  public get currentidempotencyToken(): number {
    return this._currentidempotencyToken;
  }
  public set currentidempotencyToken(value: number) {
    if (value >= 4294967295) {
      value = 0;
    }
    this._currentidempotencyToken = value;
  }
  async testDevice(
    device: SerialDevice
  ): Promise<{ device: SerialDevice; status: boolean }> {
    let sub: Subscription;
    try {
      return await Promise.race<{ device: SerialDevice; status: boolean }>([
        new Promise(async (_, reject) => {
          await asyncDelay(5000);
          reject(new DeviceTimeoutError());
        }),
        new Promise(async (resolve) => {
          await device.open();
          //wait for the device to be ready
          const readCommands = device
            .read()
            .pipe(map((m) => this.parseCommand(m)));

          sub = readCommands.subscribe(async (f) => {
            if (f == null) return;
            /**TODO: Rewrite protocol. UI sends first then CC */
            if (f.command == ReceiveCommands.Acknowledge) {
              await (async () => {
                this.acknowledgeReceivedMessage(f.idempotencyToken);
              })();
            }
            if (f.command == ReceiveCommands.Ready) {
              console.warn('PAIR RECEIVED');
              await (async () => {
                await this.sendAcknowledge(device, f.idempotencyToken);
                await this.writeToDevice(device, SendCommands.Pair);
              })();
            }
            if (f.command == ReceiveCommands.Pair) {
              const test =
                f.payload?.trim()?.match(pairKey?.trim()) != null ||
                `${f.payload?.trim()}` == `${pairKey?.trim()}`;
              if (test) {
                await this.sendAcknowledge(device, f.idempotencyToken);
                resolve({ device, status: true });
                sub?.unsubscribe();
              } else {
                throw new Error('Invalid Key');
              }
            }
          });
          this.writeToDevice(device, SendCommands.Pair);
        }),
      ]);
    } catch (err) {
      sub?.unsubscribe();
      /* port.close(); */
      await device.close();
      console.error(err);
      return { device, status: false };
    }
  }
  acknowledgeReceivedMessage(idempotencyToken: number) {
    this.serialWriteQueue.delete(idempotencyToken);
  }
  async write(
    command: SendCommands,
    payload?: string,
    idempotencyToken?: number,
    retry: boolean = true
  ) {
    await this.writeToDevice(
      this.connectedSerialDevice,
      command,
      payload,
      idempotencyToken,
      retry
    );
  }
  serialWriteQueue: Set<number> = new Set();
  private async writeToDevice(
    device: SerialDevice,
    command: SendCommands,
    payload?: string,
    idempotencyToken: number = null,
    retry: boolean = true
  ) {
    if (!this.isLeader.value) {
      this.channel.postMessage({
        type: 'serial-msg-send',
        payload: { command: command, payload: payload },
      } as InterConnectPacket);
      return;
    }
    if (idempotencyToken == null) {
      idempotencyToken = this.currentidempotencyToken;
      this.currentidempotencyToken++;
    }
    if (this.headlessMode) return;
    const wr = `${+idempotencyToken}:${command} ${payload ?? ''}\n`;

    this.serialWriteQueue.add(idempotencyToken);
    let attempts = 0;
    do {
      console.log(
        `Writing to device: "${wr}" or ${idempotencyToken}: ${
          SendCommands[command]
        } ${payload != null ? payload : ''}`
      );
      await device.write(wr);
      await asyncDelay(100);
      attempts++;
    } while (
      retry &&
      this.serialWriteQueue.has(idempotencyToken) &&
      attempts <= 3
    );
    if (attempts > 3 && this.serialWriteQueue.has(idempotencyToken)) {
      console.error(
        new Error('Failed to Send message Token:' + idempotencyToken)
      );
    }
    this.serialWriteQueue.delete(idempotencyToken);
  }

  async requestPort() {
    try {
      const port = await this.serial.requestPort();
      console.log(port.getInfo());
      return port;
    } catch (err) {
      console.error(err);
      const ports = await this.serial.getPorts();
      console.log(ports);
      return ports[1];
    }
  }
}
export class SerialAlreadyConnected extends Error {
  override message: string = 'Alreay Connected to Device';
}
export class SerialConnecting extends Error {
  override message: string = 'Connecting to Device';
}
export class NoValidConnections extends Error {
  override message: string = 'No Valid Connections Made';
}
export class NoValidDevices extends Error {
  override message: string = 'No Devices Found';
}
/* const listener = this.listenToDevice(port);
const command = await firstValueFrom(
  listener.data.pipe(
    map((msg) => {
      if (msg == null) return null;
      const command = this.parseCommand(msg);
      return command;
    }),
    tap(async (command) => {
      if (command == null) return null;
      if (command.command == ReceiveCommands.Acknowledge) {
        await this.sendAcknowledge(port, command.idempotencyToken);
        this.acknowledgeReceivedMessage(command.idempotencyToken);
      }
      if (command.command == ReceiveCommands.Ready) {
        await this.sendAcknowledge(port, command.idempotencyToken);
        this.acknowledgeReceivedMessage(command.idempotencyToken);
        await this.writeToDevice(port, SendCommands.Pair);
      }
    }),
    first((command) => {
      if (command == null) return false;
      if (command.command == ReceiveCommands.Pair) {
        return command.payload.match(pairKey) != null;
      }
      return false;
    })
  )
); */

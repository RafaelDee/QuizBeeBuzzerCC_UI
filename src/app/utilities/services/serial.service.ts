import { EventEmitter, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  first,
  firstValueFrom,
  map,
  Observable,
  Subscription,
  tap,
} from 'rxjs';
import { Command } from './game-manager.service';
import { asyncDelay } from '../common-utils';
var defaultSerialOptions: SerialOptions = {
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
const pairKey: string = 'c8e89336-1cbb-4028-b1fe-0079c00d6b4f';
const filters = [{ usbVendorId: 4292, usbProductId: 60000 }];
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
}
const sendCommandsList = [
  'Acknowledge',
  'ResetGameState',
  'Pair',
  'Summary',
  'ReadyGameState',
  'CorrectAnswer',
  'WrongAnswer',
  'SuspenseGame',
  'SpotLightPodium',
];
export enum ReceiveCommands {
  Acknowledge,
  Dnr,
  Pair,
  Ready,
  HeartbeatCmd,
  PodiumAdded,
  PodiumPlacement,
  BattStat,
}
const receiveCommandsList = [
  'Acknowledge',
  'Dnr',
  'Pair',
  'Ready',
  'HeartbeatCmd',
  'PodiumAdded',
  'PodiumPlacement',
  'BattStat',
];
function charToCommand<T>(char: string, enumType: any): T | null {
  // Check if the character matches any value in the enum
  const command = Object.values(enumType).find((value) => value === char);

  // If a match is found, return the corresponding enum value; otherwise, return null
  return command ? (command as T) : null;
}
class PortNotConnectedError extends Error {
  override message: string = 'Cannot open port';
}
class DeviceTimeoutError extends Error {
  override message: string = 'Device took too long to respond correctly ';
}
class SerialDevice {
  textEncoder = new TextEncoderStream();
  private textDecoder: TextDecoderStream | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writableStreamClosed: Promise<void> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private stream = new BehaviorSubject<string>(null);
  private isReading = false;
  private disconnected = false;
  public ondisconnect: () => void;
  constructor(public port: SerialPort) {
    const bc = new BroadcastChannel("test_channel");
    port.ondisconnect = () => this.disconnect();
  }
  disconnect(){
    if(this.disconnected)return;
    this.disconnected = true;
    this.ondisconnect?.call(null)
  }
  async open(options: SerialOptions = defaultSerialOptions) {
    try {
      this.stream = new BehaviorSubject<string>(null);
      // First ensure we're fully closed
      try {
        await this.close();
      } catch (err) {
        console.warn(err);
      }

      // Then open the port
      try {
        await this.port.open(options);
      } catch (err) {
        await this.close();
      }
      if (!this.port.readable || !this.port.writable) {
        throw new PortNotConnectedError();
      }

      // Initialize streams
      this.textEncoder = new TextEncoderStream();
      this.textDecoder = new TextDecoderStream();

      // Set up the pipeline
      this.writableStreamClosed = this.textEncoder.readable.pipeTo(
        this.port.writable
      );
      this.readableStreamClosed = this.port.readable.pipeTo(
        this.textDecoder.writable
      );

      // Get reader and writer
      this.writer = this.textEncoder.writable.getWriter();
      this.reader = this.textDecoder.readable.getReader();

      // Start reading loop
      this.isReading = true;
      this.disconnected = false;
      await asyncDelay(200);
      this.readLoop();
    } catch (error) {
      console.error('Failed to open port:', error);
      await this.close();
      /* if (error instanceof DOMException && error.code === DOMException.NETWORK_ERR){

      } */

      throw error;
    }
  }
  private async readLoop() {
    let buffer = '';

    try {
      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          this.stream.next(line);
        }
      }
    } catch (error) {
      console.error('Error in read loop:', error);
      this.stream.error(error);
    } finally {
      this.isReading = false;
    }
  }

  async write(chunk?: string) {
    if (!this.writer) {
      throw new Error('Port is not open');
    }
    try {
      await this.writer.write(chunk);
      await asyncDelay(10);
    } catch (error) {
      console.error('Write error:', error);
      throw error;
    }
  }

  async close() {
    this.isReading = false;

    try {
      // Release writer
      if (this.writer) {
        await this.writer.close().catch(() => {});
        this.writer.releaseLock();
        this.writer = null;
      } else {
        console.warn('Missing writer');
      }

      // Release reader
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
        this.reader.releaseLock();
        this.reader = null;
      } else {
        console.warn('Missing reader');
      }

      // Wait for streams to close
      if (this.writableStreamClosed) {
        await this.writableStreamClosed.catch(() => {});
        this.writableStreamClosed = null;
      }
      if (this.readableStreamClosed) {
        await this.readableStreamClosed.catch(() => {});
        this.readableStreamClosed = null;
      }

      // Clean up streams
      this.textEncoder = null;
      this.textDecoder = null;

      // Close port
      if (this.port?.readable || this.port?.writable) {
        await this.port.close().catch(() => {});
      }
      this.disconnect();
    } catch (error) {
      console.error('Error during close:', error);
    }
  }

  read() {
    return this.stream.asObservable();
  }
}
const connectionStatusList = [
  'connected',
  'connecting',
  'disconnected',
] as const;
export type ConnectionStatus = (typeof connectionStatusList)[number];
@Injectable({
  providedIn: 'root',
})
export class SerialService {
  private _stream: BehaviorSubject<Command> = new BehaviorSubject(undefined);
  stream = this._stream.asObservable();
  serialSupport = new BehaviorSubject<boolean>(null);
  connectedSerialDevice: SerialDevice;
  connectionStatus = new BehaviorSubject<ConnectionStatus>('disconnected');
  private serial: Serial;
  constructor() {}
  async initializeSerial() {
    if (this.connectionStatus.value == 'connected')
      throw new SerialAlreadyConnected();
    this.connectionStatus.next('connecting');
    const serialSupported = 'serial' in navigator;
    this.serialSupport.next(serialSupported);
    if (!serialSupported) return;
    this.serial = await navigator.serial;

    await this.connectToDevice();
  }
  async disconnect() {
    await this.connectedSerialDevice.close();
    //use different listener, prob use connectedSerialDevice
    this.connectionStatus.next('disconnected');
  }

  async requestPort() {
    await this.serial.requestPort();
  }
  /**@Throwable */
  async connect() {
    if (this.connectionStatus.value == 'connecting')
      throw new SerialConnecting();
    await this.initializeSerial();
  }
  sub: Subscription;
  async connectToDevice() {
    const ports = await this.serial.getPorts({ filters });
    console.log(`available ports: ${ports.length}`);
    const serialDevices = await Promise.all(
      ports?.map((p) => new SerialDevice(p))
    );
    try {
      const testConnections = (
        await Promise.all(serialDevices?.map((p) => this.testDevice(p)))
      ).filter((f) => {
        return f.status;
      });
      console.log(`successful devices: ${testConnections.length}`);
      const validConncetion = testConnections.pop();
      const hasConnection = validConncetion != null;

      if (!hasConnection) throw new NoValidConnections();
      this.connectedSerialDevice = validConncetion.device;
      this.connectedSerialDevice.ondisconnect = () => {
        this.disconnect();
      };
      this.sub?.unsubscribe();
      this.sub = validConncetion.device.read().subscribe(async (r) => {
        const command = this.parseCommand(r);
        if (!command) return;
        await this.sendAcknowledge(
          validConncetion.device,
          command.idempotencyToken
        );
        if (command.command == ReceiveCommands.Acknowledge)
          this.acknowledgeReceivedMessage(command.idempotencyToken);
        this._stream.next(command);
      });
      this.connectionStatus.next('connected');
    } catch (err) {
      this.connectionStatus.next('disconnected');
      this.sub?.unsubscribe();
      for (let device of serialDevices) {
        device.close();
      }
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
    if (stream == null) return null;
    console.log('parsing:' + stream);
    if (!stream.charAt(0).match('/')) return null;
    const parseKey = stream.substring(1).split(':', 2);
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
    const split = cmd.split(' ', 2);
    if (split == null || split.length <= 0) return null;
    const command = Number.parseInt(split.shift());
    if (Number.isNaN(command)) {
      console.log(`${stream}`);
      return null;
    }
    console.log(`command: ${receiveCommandsList[command]} ${split.join(' ')}`);
    return { command: command, idempotencyToken, payload: split.join(' ') };
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
    if (idempotencyToken == null) {
      idempotencyToken = this.currentidempotencyToken;
      this.currentidempotencyToken++;
    }
    const commandChar = [command, payload].filter((f) => f != null).join(',');
    const wr = `${idempotencyToken}:${commandChar}\n`;

    this.serialWriteQueue.add(idempotencyToken);
    let attempts = 0;
    do {
      console.log(
        `Wiriting to device: "${wr}" or ${idempotencyToken}: ${
          sendCommandsList[command]
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
  }

  listenToDevice(port: SerialPort): {
    closed: Promise<void>;
    data: Observable<string>;
  } {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    return {
      closed: readableStreamClosed.catch(() => {}),
      data: new Observable<string>((subscriber) => {
        // Ensure the port is open before reading
        (async () => {
          let buffer = '';
          // Listen to data coming from the serial device.
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              reader.releaseLock();
              break;
            }
            // value is a string.
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              subscriber.next(line);
            }
          }
        })();

        // Handle unsubscription
        return async () => {
          reader.cancel();
        };
      }),
    };
  }

  async requestPortDevice(serial: any) {
    try {
      const port = await serial.requestPort({ filters });
      console.log(port.getInfo());
      return port;
    } catch (err) {
      console.error(err);
      const ports = await serial.getPorts({ filters });
      console.log(ports);
      return ports[1];
    }
  }
}
export class SerialAlreadyConnected extends Error {}
export class SerialConnecting extends Error {}
export class NoValidConnections extends Error {}
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

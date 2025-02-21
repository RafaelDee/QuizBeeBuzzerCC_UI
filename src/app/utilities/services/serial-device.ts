import { BehaviorSubject } from 'rxjs';
import { defaultSerialOptions, pairKey } from './serial.service';
import { asyncDelay } from '../common-utils';

export class DeviceTimeoutError extends Error {
  override message: string = 'Device took too long to respond correctly ';
}
class PortNotConnectedError extends Error {
  override message: string = 'Cannot open port';
}
export class SerialDevice {
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
    port.ondisconnect = () => this.disconnect();
  }
  disconnect() {
    if (this.disconnected) return;
    this.disconnected = true;
    this.ondisconnect?.call(null);
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
  private processStream(stream:string){

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

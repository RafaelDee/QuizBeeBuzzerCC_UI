export  class Channel<T> {
  channel: BroadcastChannel;
  private _onmessage: ((event: MessageEvent<T>) => void) | null = null;

  public constructor(channelId: string) {
    this.channel = new BroadcastChannel(channelId);
  }

  postMessage(message: T) {
    this.channel.postMessage(message);
  }

  // Getter and setter for onmessage
  get onmessage(): ((event: MessageEvent<T>) => void) | null {
    return this._onmessage;
  }

  set onmessage(handler: ((event: MessageEvent<T>) => void) | null) {
    this._onmessage = handler;

    if (handler != null) {
      this.channel.onmessage = (event: MessageEvent<T>) => {
        handler(event);
      };
    } else {
      this.channel.onmessage = null;
    }
  }
}

// Example usage
interface PointsSystemSendCommands {
  type: string;
  payload: any;
}

class YourClass {
  channelRec: Channel<PointsSystemSendCommands>;

  constructor() {
    this.channelRec = new Channel<PointsSystemSendCommands>('points-system');

    // Correctly set the message handler with proper typing
    this.channelRec.onmessage = (event) => {
      // event is now typed as MessageEvent<PointsSystemSendCommands>
      console.log(event.data.type);
      console.log(event.data.payload);
    };
  }
}

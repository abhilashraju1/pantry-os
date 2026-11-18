import { WSEventEnvelope } from '@pantryos/contracts';

export interface WebSocketLike {
  readyState: number;
  send: (data: string) => void;
  on: (event: string, cb: any) => void;
}

interface ClientConnection {
  ws: WebSocketLike;
  branchId: string;
}

export class WebSocketHub {
  private clients: Set<ClientConnection> = new Set();

  public register(ws: WebSocketLike, branchId: string) {
    const client: ClientConnection = { ws, branchId };
    this.clients.add(client);

    ws.on('close', () => {
      this.clients.delete(client);
    });
  }

  public broadcast(event: WSEventEnvelope) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.branchId === event.branchId && client.ws.readyState === 1) { // 1 = OPEN
        client.ws.send(payload);
      }
    }
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }
}

export const wsHub = new WebSocketHub();

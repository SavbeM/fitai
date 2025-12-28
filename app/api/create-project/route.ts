import { z } from "zod";
import type { WebSocket } from "ws";

import { InitProjectService } from "@/services/init_service/initProjectService";
import {ClientMessageSchema} from "@/lib/validation-schema-zod";
import {ServerMessage} from "@/services/init_service/projectInitTypes";


export const runtime = "nodejs";

type ClientMessage = z.infer<typeof ClientMessageSchema>;

const send = (ws: WebSocket, msg: ServerMessage) => {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
};

export function GET() {
  const headers = new Headers();
  headers.set('Connection', 'Upgrade');
  headers.set('Upgrade', 'websocket');
  return new Response('Upgrade Required', { status: 426, headers });
}

// next-ws entrypoint: Next.js will call this on WS upgrade.
export async function UPGRADE(client: WebSocket) {

  send(client, { type: "hello" });

  client.on("message", async (data) => {
    let parsed: ClientMessage;
    try {
      parsed = ClientMessageSchema.parse(JSON.parse(data.toString()));
    } catch {
      send(client, {
        type: "error",
        payload: { message: "Invalid message format" },
      });
      return;
    }

    const { userId, title, description } = parsed.payload;

    const service = new InitProjectService();
    try {
      await service.initProject(userId, title, description, (stepResponse) => {
        send(client, { type: "step", payload: stepResponse });
      });


    } catch (e) {
      const message = JSON.stringify(e);
      send(client, { type: "error", payload: { message } });
    }
  });

  client.on("close", () => {
    console.log("Client connection closed");
  });

  client.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });
}

// keep GET handler for non-WS requests useful for quick health checks.
// export async function GET() {
//   return new Response(
//     "This endpoint speaks WebSocket. Connect with a WS client and send {type:'create-project', payload:{...}}",
//     { status: 200 },
//   );
// }

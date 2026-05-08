import * as signalR from '@microsoft/signalr'
import { store } from '../store/store'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let connection: signalR.HubConnection | null = null

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/chat`, {
        // Always fetch the latest token from Redux at connection time
        accessTokenFactory: () => store.getState().auth.accessToken || '',
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()
  }
  return connection
}

export async function startChatConnection(): Promise<void> {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function stopChatConnection(): Promise<void> {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
    connection = null;
  }
}

// feathersClient.ts
'use client'
import {feathers} from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

let client;

if (typeof window !== 'undefined') {
  const socket = io('http://localhost:3030');
  client = feathers();

  client.configure(socketio(socket));
}

export default client;

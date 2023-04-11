import Websoket from 'ws';

const Server = Websoket.WebSocketServer;

const wss = new Server({
  clientTracking: false,
  noServer: true,
  host: 'localhost',
  port: 5173,
});

wss.on('connection', (ws: Websoket) => {
  console.log('connected');

  ws.on('message', (message: string) => {
    console.log(message);
    ws.send('Hello from server');
  });
  ws.on('close', () => {
    console.log('disconnected');
  });
});

export default wss;

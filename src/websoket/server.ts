import Websoket from 'ws';

const Server = Websoket.WebSocketServer;

const wss = new Server({
  clientTracking: false,
  noServer: true,
});

wss.on('connection', (ws: Websoket) => {
  console.log('connected');

  ws.on('message', (message: string) => {
    const newMessage = JSON.parse(message);

    ws.send(JSON.stringify(newMessage));
  });
  ws.on('close', () => {
    console.log('disconnected');
  });
});

export default wss;

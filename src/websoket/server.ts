import Websoket from 'ws';

const Server = Websoket.WebSocketServer;

const wss = new Server({
  clientTracking: true,
  noServer: true,
});

wss.on('connection', (ws: Websoket) => {
  console.log('connected');
  ws.on('open', () => {
    console.log('opened');
    ws.send('hello');
  });

  ws.on('message', (message: string) => {
    const newMessage = JSON.parse(message);

    ws.send(JSON.stringify(newMessage));
  });
  ws.on('close', () => {
    console.log('disconnected');
  });
});

export default wss;

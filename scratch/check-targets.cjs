const wsUrl = process.env.AGY_BROWSER_WS_URL;
if (!wsUrl) {
  console.error('AGY_BROWSER_WS_URL is not set.');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Target.getTargets'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id === 1 && data.result) {
    console.log(JSON.stringify(data.result.targetInfos, null, 2));
    ws.close();
  }
};

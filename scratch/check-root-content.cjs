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
    const targets = data.result.targetInfos;
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
      console.error('No page target found!');
      ws.close();
      return;
    }
    
    ws.send(JSON.stringify({
      id: 2,
      method: 'Target.attachToTarget',
      params: { targetId: pageTarget.targetId, flatten: true }
    }));
  }
  
  if (data.id === 2 && data.result) {
    const sessionId = data.result.sessionId;
    
    // Enable runtime
    ws.send(JSON.stringify({
      id: 3,
      sessionId,
      method: 'Runtime.enable'
    }));

    // Navigate to local preview
    ws.send(JSON.stringify({
      id: 4,
      sessionId,
      method: 'Page.navigate',
      params: { url: 'http://localhost:4173/' }
    }));

    // After 3 seconds, evaluate content of root
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 5,
        sessionId,
        method: 'Runtime.evaluate',
        params: {
          expression: 'document.getElementById("root").innerText.substring(0, 500)'
        }
      }));
    }, 3000);
  }

  if (data.id === 5 && data.result) {
    console.log('ROOT INNER TEXT PREVIEW:');
    console.log(data.result.result.value);
    ws.close();
  }
};

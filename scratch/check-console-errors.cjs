const wsUrl = process.env.AGY_BROWSER_WS_URL;
if (!wsUrl) {
  console.error('AGY_BROWSER_WS_URL is not set.');
  process.exit(1);
}

console.log('Connecting to browser WebSocket:', wsUrl);
const ws = new WebSocket(wsUrl);

let sessionId = null;
let currentTargetId = null;

ws.onopen = () => {
  console.log('Connected to browser!');
  // Query targets
  ws.send(JSON.stringify({
    id: 1,
    method: 'Target.getTargets'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.id === 1 && data.result) {
    const targets = data.result.targetInfos;
    console.log('Found targets:', targets.length);
    // Find the first 'page' target
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
      console.error('No page target found!');
      ws.close();
      return;
    }
    
    currentTargetId = pageTarget.targetId;
    console.log('Attaching to page target:', currentTargetId);
    
    // Attach to page target
    ws.send(JSON.stringify({
      id: 2,
      method: 'Target.attachToTarget',
      params: { targetId: currentTargetId, flatten: true }
    }));
  }
  
  // Attached to target
  if (data.id === 2 && data.result) {
    sessionId = data.result.sessionId;
    console.log('Attached to target, sessionId:', sessionId);
    
    // Enable Runtime events
    ws.send(JSON.stringify({
      id: 3,
      sessionId,
      method: 'Runtime.enable'
    }));

    // Enable Page events
    ws.send(JSON.stringify({
      id: 4,
      sessionId,
      method: 'Page.enable'
    }));
    
    // Navigate page target to the website
    console.log('Navigating page target to http://localhost:4173/ ...');
    ws.send(JSON.stringify({
      id: 5,
      sessionId,
      method: 'Page.navigate',
      params: { url: 'http://localhost:4173/' }
    }));
  }

  // Handle runtime exceptions
  if (data.method === 'Runtime.exceptionThrown') {
    console.error('EXCEPTION RECEIVED IN PAGE:');
    console.error(JSON.stringify(data.params.exceptionDetails, null, 2));
  }

  // Handle console messages
  if (data.method === 'Runtime.consoleAPICalled') {
    const args = data.params.args.map(arg => arg.value || arg.description || arg.type);
    console.log('CONSOLE:', data.params.type, ...args);
  }
};

ws.onerror = (err) => {
  console.error('WebSocket error:', err);
};

// Close connection after 8 seconds
setTimeout(() => {
  console.log('Closing target and WebSocket...');
  ws.close();
}, 8000);

// BareMux configuration
(function() {
  // Use the distributed worker from node_modules
  const workerPath = "/baremux/worker.js";
  
  // Get WISP URL based on protocol
  const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
  
  console.log("📡 BareMux WISP URL:", wispUrl);
  
  // Make it globally available
  if (typeof window !== 'undefined') {
    window.WISP_URL = wispUrl;
  }
})();

var timeout_queryStateAndFireIfStateChange;
var detectionInterval = 5000; //milliseconds

function startPolling() {
	setTimeout(queryState, detectionInterval)
}
function queryState() {
	self.postMessage({aTopic:'debug-queryState-fired'});
	setTimeout(queryState, detectionInterval)
}

//init
queryState();

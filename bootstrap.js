const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const self = {
	path: {
		chrome: 'chrome://idlestatelocked/content/',
		modules: 'chrome://idlestatelocked/content/modules/',
		workers: 'chrome://idlestatelocked/content/modules/workers/'
	}
};
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/devtools/Console.jsm');

var chromeWorker_pollLockedState = null;

function loadAndSetupChromeWorker_pollLockedState() {
	if (chromeWorker_pollLockedState !== null) {
		console.warn('chromeWorker_pollLockedState chromeworker is already started');
		return;
	}
	chromeWorker_pollLockedState = new ChromeWorker(self.path.workers + 'pollLockedState.js');

	function handleMessageFromChromeWorker_pollLockedState(msg) {
		//console.log('incoming message from worker', 'pollLockedState', 'msg:', msg, msg.data);
		switch (msg.data.aTopic) {
			case 'debug-queryState-fired':
				console.log('debug-queryState-fired');
				break;
			default:
				console.warn('no handle for incoming aTopic of:', aTopic);
				//do nothing
		}
	}

	chromeWorker_pollLockedState.addEventListener('message', handleMessageFromChromeWorker_pollLockedState);
}

function install() {}

function uninstall() {}

function startup() {
	loadAndSetupChromeWorker_pollLockedState(); //must do after startup
	//myWorker.postMessage({aTopic:'msg1'});
}
 
function shutdown(aReason) {
	if (aReason == APP_SHUTDOWN) return;
	chromeWorker_pollLockedState.terminate();
}

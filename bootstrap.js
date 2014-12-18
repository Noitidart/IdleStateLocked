const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const self = {
	name: 'IdleStateLocked',
	id: 'IdleStateLocked@jetpack',
	packagename: 'idlestatelocked',
	path: {
		chrome: 'chrome://idlestatelocked/content/',
		modules: 'chrome://idlestatelocked/content/modules/',
		workers: 'chrome://idlestatelocked/content/modules/workers/'
	},
	aData: 0
};
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/devtools/Console.jsm');

var chromeWorker_pollLockedState = null;
var chromeWorker_pollLockedState_bootstrapCallbacksAwaitingPostMessageFromChromeWorker = {};

function loadAndSetupChromeWorker_pollLockedState() {
	if (chromeWorker_pollLockedState !== null) {
		console.warn('chromeWorker_pollLockedState chromeworker is already started');
		return;
	}
	chromeWorker_pollLockedState = new ChromeWorker(self.path.workers + 'pollLockedState.js');

	function handleMessageFromChromeWorker_pollLockedState(msg) {
		//console.log('incoming message from worker', 'pollLockedState', 'msg:', msg, msg.data);
		switch (msg.data.aTopic) {
			case 'queryState':
				console.info('incoming queryState reply:', msg.data.aData);
				break;
			case 'onStateChange':
				Services.obs.notifyObservers(null, 'IdleStateLocked::onStateChange', msg.data.aData);
				break;
			case 'debug-timeout-fired':
				console.log('debug-timeout-fired', new Date().toLocaleTimeString());
				break;
			case 'debug-queryState-fired':
				console.log('debug-queryState-fired', new Date().toLocaleTimeString());
				break;
			case 'setDetectionIntervalInSeconds': //example usage that this case responds to: chromeWorker_pollLockedState.postMessage({aTopic:'setDetectionIntervalInSeconds', aData:10})
				console.log('setDetectionIntervalInSeconds :: ', msg.data.aData);
				break;
			case 'getDetectionIntervalInSeconds':
				if ('aCallbackId' in msg.data) {
					if (msg.data.aCallbackId in chromeWorker_pollLockedState_bootstrapCallbacksAwaitingPostMessageFromChromeWorker) {
						console.log('found callback that was waiting for this chrome worker post message');
						var detectionIntervalInSeconds = msg.data.aData;
						chromeWorker_pollLockedState_bootstrapCallbacksAwaitingPostMessageFromChromeWorker[msg.data.aCallbackId](detectionIntervalInSeconds);
						delete chromeWorker_pollLockedState_bootstrapCallbacksAwaitingPostMessageFromChromeWorker[msg.data.aCallbackId];
					} else {
						console.log('bootstrap got msg from ChromeWorker with aCallbackId but this aCallbackId was not found in this chromeworkers object of callbacks awaiting msgs');
					}
				} else {
					throw new Error('I messed up in ChromeWorker, I have to make the chromeworker postMessage of getDetectionIntervalInSeconds send with aCallbackId');
				}
				break;
			case 'error':
				//do nothing as browser console will show the `throw new Error` from the ChromeWorker
				break;
			default:
				console.warn('no handling for incoming aTopic of:', msg.data.aTopic);
				//do nothing
		}
	}

	chromeWorker_pollLockedState.addEventListener('message', handleMessageFromChromeWorker_pollLockedState);
	chromeWorker_pollLockedState.postMessageWithCallback = function(msg, callback) {
		if (typeof callback != 'function') {
			throw new Error('second argument MUST be a function');
		}
		msg.aCallbackId = new Date().getTime() + '-' + Math.random();
		chromeWorker_pollLockedState_bootstrapCallbacksAwaitingPostMessageFromChromeWorker[msg.aCallbackId] = callback;
		chromeWorker_pollLockedState.postMessage(msg);
	}
	//example usage: chromeWorker_pollLockedState.postMessageWithCallback({aTopic:'getDetectionIntervalInSeconds'}, function(a) { console.log('received detectionIntervalInSeconds, it is:', a) });
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

const bootstrapSelf = {
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

var timeout_queryStateAndFireIfStateChange;
var detectionInterval = 5000; //milliseconds
var lastState; //undefined for needing init, 0 for not locked, 1 for locked
var timeLastDid__timeout_queryStateAndFireIfStateChange__ = 0;
self.onmessage = function (msg) {
	//dump('incoming message to ChromeWorker, msg:' + uneval(msg)); //does not dump to Browser Console
	//console.log('msg from worker onmessage'); //does not work but doesnt interrtup code
	switch (msg.data.aTopic) {
		case 'getDetectionInterval':
			self.postMessage({aTopic:'getDetectionInterval', aData:detectionInterval});
			break;
		case 'setDetectionIntervalInSeconds':
			stopPolling();
			var now = new Date().getTime();
			var newDetectionInterval = msg.data.aData * 1000; //convert to ms
			if (newDetectionInterval <= 0) {
				throw new Error('Must set detectionInterval greater than or equal to 1s');
			} else if (newDetectionInterval == detectionInterval) {
				throw new Error('New detectionInterval is same as current, so no change');
			}
			detectionInterval = msg.data.aData;
			var sinceLastAuto = now - timeLastDid__timeout_queryStateAndFireIfStateChange__;
			if (sinceLastAuto >= detectionInterval) {
				//user changed detectionInterval and the time since it last did (timeout_queryStateAndFireIfStateChange) is greater than the new detectionInterval so queryStateAndFireIfStateChange() then after that startPolling with new detectionInterval
				self.postMessage({aTopic:'setDetectionIntervalInSeconds', aData:'sinceLastAuto is ' + sinceLastAuto + 'ms and this is greater than the new detectionInterval so triggery queryState, and then startPoll'});
				queryStateAndFireIfStateChange();
				startPolling();
			} else {
				//user changed detectionInterval and the time since it last did (timeout_queryStateAndFireIfStateChange) is less than the new detectionInterval so startPoll with the difference till it reaches the new detectionInterval
				self.postMessage({aTopic:'setDetectionIntervalInSeconds', aData:'sinceLastAuto is ' + sinceLastAuto + 'ms and this is less than the new detectionInterval so startPoll with override of ' + (detectionInterval - sinceLastAuto) + 'ms'});
				startPolling(detectionInterval - sinceLastAuto);
			}
			break;
		case 'queryState':
			var nowState = queryState();
			self.postMessage({aTopic:'queryState', aData:strOfState(nowState)});
			break;
		default:
			throw 'no aTopic on incoming message to ChromeWorker';
	}
}

self.onerror = function(message, filename, lineno) {
	self.postMessage({aTopic:'error', aData:{message:message, filename:filename, lineno:lineno}});
}

var lib = {};
/*
var lib = {
	CoreGraphics: '/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics',
	CoreFoundation: '/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation'
};
for (var l in lib) {
	lib[l] = ctypes.open(lib[l]);
}
*/

switch (OS.Constants.Sys.Name.toLowerCase()) {
	case 'winnt':
	case 'winmo':
	case 'wince':
		importScripts(bootstrapSelf.path.modules + 'ostypes_win.jsm');
		break;
	case 'linux':
	case 'freebsd':
	case 'openbsd':
	case 'sunos':
	case 'webos': // Palm Pre
	case 'android':
		importScripts(bootstrapSelf.path.modules + 'ostypes_nix.jsm');
		break;
	case 'darwin':
		importScripts(bootstrapSelf.path.modules + 'ostypes_mac.jsm');
		break;
	default:
		throw new Error('OS not recognized, OS: "' + OS.Constants.Sys.Name + '"');
}

function strOfState(state) {
	switch (state) {
		case 0:
			return 'notlocked';
		case 0:
			return 'locked';
		break;
		default:
			return 'Exception: No string defined for state of: "' + state + '"';
	}
}

function startPolling(overrideDetectionInterval) {
	//start timeout
	var useInterval = detectionInterval;
	if (overrideDetectionInterval) {
		useInterval = overrideDetectionInterval;
	}
	timeout_queryStateAndFireIfStateChange = setTimeout(auto_queryStateAndFireIfStateChange, useInterval);
}

function stopPolling() {
	clearTimeout(timeout_queryStateAndFireIfStateChange);
}

function auto_queryStateAndFireIfStateChange() {
	timeLastDid__timeout_queryStateAndFireIfStateChange__ = new Date().getTime();
	self.postMessage({aTopic:'debug-timeout-fired'});
	queryStateAndFireIfStateChange();
	startPolling();
}

function queryStateAndFireIfStateChange() {
	var nowState = queryState();
	if (nowState != lastState) {
		var lastStateHolder = lastState; //just putting this here in case i use it, as im changing lastState here right now
		lastState = nowState;
		self.postMessage({aTopic:'onStateChanged', aData:strOfState(nowState)});
	}
}

function queryState() {
	self.postMessage({aTopic:'debug-queryState-fired'});
	var nowState;
	switch (OS.Constants.Sys.Name.toLowerCase()) {
		case 'winnt':
		case 'winmo':
		case 'wince':
			nowState = 1;
			break;
		case 'linux':
		case 'freebsd':
		case 'openbsd':
		case 'sunos':
		case 'webos': // Palm Pre
		case 'android':
			nowState = 1;
			break;
		case 'darwin':
			nowState = 1;
			break;
		default:
			throw new Error('OS not recognized, OS: "' + OS.Constants.Sys.Name + '"');
	}
	if (nowState >= 0) {
		return nowState;
	} else {
		throw new Error('Failed to queryState');
	}
}

//init
lastState = queryState();
startPolling();
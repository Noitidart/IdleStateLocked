var EXPORTED_SYMBOLS = ['ostypes'];

if (ctypes.voidptr_t.size == 4 /* 32-bit */) {
	var is64bit = false;
} else if (ctypes.voidptr_t.size == 8 /* 64-bit */) {
	var is64bit = true;
} else {
	throw new Error('huh??? not 32 or 64 bi?!?!');
}

var mactypesInit = function(initCFTypes) {
	this.is64bit = is64bit;
	
	//start mactypes
	this.Boolean = ctypes.unsigned_char;
	this.UniChar = ctypes.jschar; // uint16 with automatic conversion
	//end mactypes 
	
	this.F_GETLK = 7;
	this.F_RDLCK = 1;
	this.F_WRLCK = 3;
	this.F_UNLCK = 2;
	
	/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man2/fcntl.2.html
	 *       struct flock {
	 *           off_t       l_start;    // starting offset
	 *           off_t       l_len;      // len = 0 means until end of file
	 *           pid_t       l_pid;      // lock owner
	 *           short       l_type;     // lock type: read/write, etc.
	 *           short       l_whence;   // type of l_start
	 *       };
	 */
	//order matters:
	// http://chat.stackexchange.com/transcript/message/17822233#17822233
	// https://ask.mozilla.org/question/1134/order-of-strcuture-matters-test-case-flock-for-use-by-fcntl/
	this.flock = new ctypes.StructType('flock', [
		{'l_start': ctypes.unsigned_long},
		{'l_len': ctypes.unsigned_long},
		{'l_pid': ctypes.int},
		{'l_type': ctypes.unsigned_short},
		{'l_whence': ctypes.unsigned_short}
	]);
	
	if (initCFTypes) {
		//start CoreFoundationTypes
		this.__CFBoolean = new ctypes.StructType('__CFBoolean');
		this.CFBooleanRef = this.__CFBoolean.ptr;
		this.__CFNumber = new ctypes.StructType('__CFNumber');
		this.CFNumberRef = this.__CFNumber.ptr;
		this.CFTypeRef = ctypes.void_t.ptr;
		this.__CFString = new ctypes.StructType('__CFString');
		this.CFStringRef = this.__CFString.ptr;
		this.CFIndex = ctypes.long;
		this.CFNumberType = this.CFIndex;
		this.CFRange = new ctypes.StructType('CFRange', [{location: this.CFIndex}, {length: this.CFIndex}]);
		this.__CFAllocator = new ctypes.StructType('__CFAllocator');
		this.CFAllocatorRef = this.__CFAllocator.ptr;
		//end CoreFoundationTypes 
	}
}

var ostypes = new mactypesInit(true); //for IdleStateLocked I need to pass true as i need CFTypes
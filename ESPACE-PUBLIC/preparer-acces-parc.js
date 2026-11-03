(async () => {
  "use strict";
  // QRCode for JavaScript — Kazuhiko Arase, MIT (licence conservée ci-dessous).
  const QRLocal = (() => {
    const modules = {
'./QR8bitByte': function(module,exports,require){
var QRMode = require('./QRMode');

function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};

module.exports = QR8bitByte;

},
'./QRBitBuffer': function(module,exports,require){
function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};

module.exports = QRBitBuffer;

},
'./QRErrorCorrectLevel': function(module,exports,require){
module.exports = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};


},
'./QRMaskPattern': function(module,exports,require){
module.exports = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

},
'./QRMath': function(module,exports,require){
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

module.exports = QRMath;

},
'./QRMode': function(module,exports,require){
module.exports = {
    MODE_NUMBER :       1 << 0,
    MODE_ALPHA_NUM :    1 << 1,
    MODE_8BIT_BYTE :    1 << 2,
    MODE_KANJI :        1 << 3
};

},
'./QRPolynomial': function(module,exports,require){
var QRMath = require('./QRMath');

function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};

module.exports = QRPolynomial;

},
'./QRRSBlock': function(module,exports,require){
var QRErrorCorrectLevel = require('./QRErrorCorrectLevel');

function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

module.exports = QRRSBlock;

},
'./QRUtil': function(module,exports,require){
var QRMode = require('./QRMode');
var QRPolynomial = require('./QRPolynomial');
var QRMath = require('./QRMath');
var QRMaskPattern = require('./QRMaskPattern');

var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};

module.exports = QRUtil;

},
'./index': function(module,exports,require){
//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
// Modified to work in node for this project (and some refactoring)
//---------------------------------------------------------------------

var QR8bitByte = require('./QR8bitByte');
var QRUtil = require('./QRUtil');
var QRPolynomial = require('./QRPolynomial');
var QRRSBlock = require('./QRRSBlock');
var QRBitBuffer = require('./QRBitBuffer');

function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};

module.exports = QRCode;

},
    };
    const cache = {};
    function require(name) {
      if (!cache[name]) { const m = cache[name] = {exports:{}}; modules[name](m,m.exports,require); }
      return cache[name].exports;
    }
    return require('./index');
  })();

  const autoriser=document.getElementById("autoriser-geolocalisation");
  const statut=document.getElementById("statut-geolocalisation");
  const contenu=document.getElementById("preparation-contenu");
  const confirmation=document.getElementById("confirmation-geolocalisation");
  const utiliseTelephone=document.getElementById("utilise-telephone");
  const confirmationTelephone=document.getElementById("confirmation-telephone");
  let flow=String(window.LCDP_GEO_FLOW||"");
  let tokenConfirmation=String(window.LCDP_GEO_CONFIRMATION||"");
  delete window.LCDP_GEO_FLOW;delete window.LCDP_GEO_CONFIRMATION;
  const referenceCourte=String(window.LCDP_GEO_REFERENCE||"");
  delete window.LCDP_GEO_REFERENCE;
  autoriser.disabled=true;
  const config=window.SITE_CONFIG||{};
  const endpoint=String(config.workerMdptokenzUrl||config.WORKER_MDPTOKENZ_URL||(typeof config.apiUrl==="function"?config.apiUrl("mdptokenz-api"):"")).replace(/\/+$/,"");
  if(referenceCourte){
    try{
      const resultat=await appeler("flow-short-resolve",{reference:referenceCourte});
      flow=resultat.flow;
    }catch(e){informerErreur(e.message);document.getElementById("preparation-qr").hidden=true;return;}
  }
  const QR_ACTUALISATION="data:image/png;base64,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";
  const modeActualisation=!referenceCourte && !flow && ["actualisation","compte"].includes(new URL(location.href).searchParams.get("mode"));
  const mobile=/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent);
  let enCours=false;
  let informationNavigateur="";
  let navigateurDemande="";
  function informerErreur(texte){
    statut.textContent="";
    let boite=document.getElementById("information-erreur-optin");
    if(!boite){
      const modele=document.getElementById("modele-information-erreur-optin");
      document.body.appendChild(modele.content.cloneNode(true));
      boite=document.getElementById("information-erreur-optin");
      boite.addEventListener("close",()=>boite.remove(),{once:true});
    }
    document.getElementById("texte-erreur-optin").textContent=texte;
    if(typeof boite.showModal==="function"){
      if(!boite.open)boite.showModal();
    }else{
      boite.setAttribute("open","");
    }
  }
  function etat(occupe){enCours=occupe;autoriser.disabled=occupe;}
  async function appeler(action,body={}){
    if(!endpoint)throw new Error("Service indisponible. Réessayez plus tard.");
    const r=await fetch(endpoint,{method:"POST",credentials:"omit",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...body})});
    const d=await r.json().catch(()=>null);
    if(!r.ok||!d?.success)throw new Error(d?.message||"L’enregistrement n’est pas confirmé. Réessayez.");
    return d;
  }
  function appliquerDetection(d){
    const avertissement=document.getElementById("avertissement-appareil");
    avertissement.hidden=d.mobile_detecte!==false;
  }
  let optinEnregistre=false;
  let connexionAFinaliser=null;
  let connexionTerminee=false;
  function suiteConfirmation(){
    return connexionTerminee ? " Cliquez sur OK pour accéder à votre espace membre." : " Cliquez sur OK pour vous connecter.";
  }
  function accueilMembre(){
    if(typeof config.membreUrl==="function")return config.membreUrl("/index.html");
    const base=String(config.membreBaseUrl||config.MEMBRE_BASE||"").replace(/\/+$/,"");
    if(base)return base+"/index.html";
    if(["ashdhe.github.io","huguespavret.github.io"].includes(location.hostname))return location.origin+"/LCDP_membre/index.html";
    return "https://membre.lacleduparc.fr/index.html";
  }
  async function finaliserConnexion(){
    const explicite=config.workerConnexionMembreUrl||config.WORKER_CONNEXION_MEMBRE_URL;
    const service=String(explicite||(typeof config.apiUrl==="function"?config.apiUrl("connexion-membre-api"):"https://connexion-membre-api.lacleduparc.fr")).replace(/\/+$/,"");
    const r=await fetch(service,{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"finaliser-inscription",idsession:connexionAFinaliser.sessionConnexion,membre:connexionAFinaliser.membre,navigateur:navigateurDemande})});
    const d=await r.json().catch(()=>null);
    if(!r.ok||d?.success!==true)throw new Error(d?.message||"La connexion n’est pas confirmée. Cliquez de nouveau sur le bouton pour réessayer.");
    connexionTerminee=true;connexionAFinaliser=null;
  }
  confirmation.addEventListener("close",()=>{
    if(optinEnregistre)location.assign(connexionTerminee?accueilMembre():new URL("/ESPACE-PUBLIC/connexion-membre.html",location.href).href);
  });
  function termine(){
    optinEnregistre=true;
    document.body.classList.add("optin-termine");
    contenu.hidden=true;
    statut.textContent="";
    document.getElementById("texte-confirmation-optin").textContent=informationNavigateur+suiteConfirmation();
    if(typeof confirmation.showModal==="function")confirmation.showModal();
  }
  if(modeActualisation){
    flow="";tokenConfirmation="";
    document.getElementById("identification-actualisation").hidden=false;
    document.getElementById("qr-geolocalisation").src=QR_ACTUALISATION;
    document.getElementById("etape-securite").hidden=false;
    document.getElementById("etape-securite").textContent="Sécurité du compte";
    document.getElementById("titre-preparation").textContent="Mise à jour géolocalisation";
  }
  if(flow){
    const identification=document.getElementById("identification-actualisation");
    identification.hidden=false;
    const email=document.getElementById("email-actualisation");
    email.remove();
    document.querySelector('label[for="email-actualisation"]')?.remove();
    document.getElementById("coda-actualisation").style.removeProperty("margin");
    identification.querySelector("legend").textContent="Saisissez le CODA que vous venez de créer.";
    document.getElementById("note-coda-actualisation").textContent="Vous disposez de deux essais pour cette validation. Après deux erreurs, patientez 30 minutes.";
    if(!mobile){
      identification.hidden=true;
      document.getElementById("confirmation-telephone").hidden=true;
      autoriser.parentElement.hidden=true;
    }
    if(!mobile){
      document.getElementById("qr-geolocalisation").hidden=true;
      try {
    const resultatQr=await appeler("flow-short-create",{flow});
    const destination=new URL("/ESPACE-PUBLIC/preparer-acces-parc.html", typeof config.publicUrl==="function" ? config.publicUrl("/") : (config.publicBaseUrl||config.PUBLIC_BASE||location.origin));
    destination.searchParams.set("via","qr");
    destination.hash=new URLSearchParams({r:resultatQr.reference}).toString();
    // Encodage local : le jeton du parcours ne quitte pas la page vers un service QR.
    const qr=new QRLocal(0,2);
    qr.addData(destination.href);qr.make();
    const taille=qr.getModuleCount(), module=12, marge=4;
    const canvas=document.createElement("canvas");
    canvas.width=canvas.height=(taille+2*marge)*module;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#234438";
    for(let y=0;y<taille;y++)for(let x=0;x<taille;x++)if(qr.isDark(y,x))ctx.fillRect((x+marge)*module,(y+marge)*module,module,module);
    ctx.fillStyle="#fbda2c";
    for(const [x,y] of [[0,0],[taille-7,0],[0,taille-7]])
      ctx.fillRect((x+marge+2)*module,(y+marge+2)*module,3*module,3*module);
    const imageQr=document.getElementById("qr-geolocalisation");
    imageQr.hidden=true;
    const logo=new Image();
    logo.onload=()=>{
      const cote=Math.round(taille*module*0.19);
      const position=(canvas.width-cote)/2;
      ctx.drawImage(logo,position,position,cote,cote);
      imageQr.src=canvas.toDataURL("image/png");
      imageQr.hidden=false;
    };
    logo.onerror=()=>{
      informerErreur("Le QR code n’a pas pu être préparé. Reprenez le parcours pour réessayer.");
    };
    logo.src="data:image/png;base64,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";

      } catch(e){informerErreur(e.message||"Le QR n’a pas pu être préparé. Reprenez le parcours.");return;}
    }
    document.getElementById("etape-securite").hidden=false;
    document.getElementById("titre-preparation").textContent="Préparer votre venue";
  }
  if(mobile||new URL(location.href).searchParams.get("via")==="qr"||tokenConfirmation){
    document.getElementById("preparation-qr").hidden=true;
    if(!flow&&!modeActualisation)document.getElementById("titre-preparation").hidden=true;
    
  }
  if(tokenConfirmation){
    autoriser.disabled=true;
    informerErreur("Reprenez votre parcours depuis la connexion et utilisez le nouveau QR code.");
    return;
  }
  const casesCoda=Array.from(document.querySelectorAll("[data-geo-coda]"));
  const afficherCoda=document.getElementById("afficher-coda-actualisation");
  afficherCoda.addEventListener("change",()=>{
    casesCoda.forEach(champ=>{champ.type=afficherCoda.checked?"text":"password";});
  });
  casesCoda.forEach((champ,index)=>{
    champ.addEventListener("input",()=>{
      champ.value=champ.value.replace(/[^0-9]/g,"").slice(-1);
      if(champ.value&&index<casesCoda.length-1)casesCoda[index+1].focus();
    });
    champ.addEventListener("keydown",event=>{
      if(event.key==="Backspace"&&!champ.value&&index>0)casesCoda[index-1].focus();
    });
    champ.addEventListener("paste",event=>{
      event.preventDefault();
      const chiffres=(event.clipboardData?.getData("text")||"").replace(/[^0-9]/g,"").slice(0,4-index);
      if(!chiffres)return;
      [...chiffres].forEach((chiffre,decalage)=>{casesCoda[index+decalage].value=chiffre;});
      casesCoda[Math.min(index+chiffres.length,3)].focus();
    });
  });
  autoriser.addEventListener("click",async()=>{
    if(enCours)return;
    if(connexionAFinaliser){
      etat(true);statut.textContent="Finalisation de votre connexion…";
      try{await finaliserConnexion();termine();}
      catch(e){informerErreur(e.message||"L’enregistrement n’a pas pu être confirmé. Réessayez.");}
      finally{etat(false);}
      return;
    }
    if(!utiliseTelephone.checked){
      informerErreur("Confirmez que vous utilisez ce téléphone.");
      utiliseTelephone.focus();return;
    }
    try{navigateurDemande=obtenirIdentiteNavigateurMobile();}
    catch(e){informerErreur(e.message);return;}
    if(modeActualisation){
      const email=document.getElementById("email-actualisation");
      if(!email.checkValidity()){informerErreur("Saisissez une adresse e-mail valide.");return;}
      if(casesCoda.some(champ=>!champ.checkValidity())){informerErreur("Saisissez les quatre chiffres de votre CODA.");return;}
      const code=casesCoda.map(champ=>champ.value).join("");
      etat(true);statut.textContent="Enregistrement de votre autorisation…";
      const enregistrement=appeler("geo-account-update",{email:email.value,coda:code,navigateur:navigateurDemande,telephoneConfirme:true,consent:true,version:"2026-10-24"});
      casesCoda.forEach(champ=>{champ.value="";champ.type="password";});
      afficherCoda.checked=false;
      demanderPermissionNavigateur();
      try{const d=await enregistrement;appliquerDetection(d);termine();}
      catch(e){informerErreur(e.message||"L’enregistrement n’a pas pu être confirmé. Réessayez.");}
      finally{etat(false);}
      return;
    }
    if(flow){
      const code=casesCoda.map(champ=>champ.value).join("");
      if(!mobile){statut.textContent="Scannez le QR code pour continuer sur votre téléphone.";return;}
      if(!/^[0-9]{4}$/.test(code)){informerErreur("Saisissez les quatre chiffres de votre CODA.");return;}
      etat(true);statut.textContent="Vérification du CODA et enregistrement de votre opt-in…";
      // Le consentement ne dépend pas de la réponse à la demande du navigateur.
      const enregistrement=appeler("geo-save",{flow,coda:code,navigateur:navigateurDemande,telephoneConfirme:true,consent:true,version:"2026-10-24"});
      try{
        const d=await enregistrement;
        casesCoda.forEach(champ=>{champ.value="";});
        demanderPermissionNavigateur();
        appliquerDetection(d);flow="";
        if(d.sessionConnexion){
          connexionAFinaliser={sessionConnexion:d.sessionConnexion,membre:d.membre};
          await finaliserConnexion();
        }
        termine();
      }
      catch(e){informerErreur(e.message||"L’enregistrement n’a pas pu être confirmé. Réessayez.");}
      finally{etat(false);}
    } else {
      informerErreur("Ce lien ne contient pas votre parcours. Reprenez la connexion sur votre ordinateur et scannez le QR affiché à la fin du parcours.");
    }
  });
  function demanderPermissionNavigateur(){
    // Demande lancée depuis le clic, sans attendre le réseau ni conserver les coordonnées.
    const informer=texte=>{
      informationNavigateur=texte;
      if(contenu.hidden&&confirmation.open){
        document.getElementById("texte-confirmation-optin").textContent=texte+suiteConfirmation();
      }
    };
    if(!window.isSecureContext||!navigator.geolocation){
      informer("La localisation est indisponible dans ce navigateur. Votre consentement reste valable.");return;
    }
    try{
      navigator.geolocation.getCurrentPosition(
        ()=>informer("La localisation est autorisée dans ce navigateur."),
        erreur=>informer(erreur.code===1
          ?"La localisation est refusée dans ce navigateur. Votre consentement reste valable ; vous devrez autoriser la localisation pour les contrôles au parc."
          :"La position est indisponible. Votre consentement reste valable."),
        {enableHighAccuracy:true,maximumAge:0,timeout:15000}
      );
    }catch{
      informer("La demande de localisation n’a pas abouti. Votre consentement reste valable.");
    }
  }
  function obtenirIdentiteNavigateurMobile() {
    const ua = navigator.userAgent || "";
    const nom = "lcdp_navigateur_proprietaire";
    const lire = () => {
      const prefixe = nom + "=";
      const cookie = document.cookie.split(";").map(v => v.trim()).find(v => v.startsWith(prefixe));
      return cookie ? cookie.slice(prefixe.length) : "";
    };
    let identite = lire();
    if (!/^[a-f0-9]{64}$/.test(identite)) {
      const octets = crypto.getRandomValues(new Uint8Array(32));
      identite = Array.from(octets, v => v.toString(16).padStart(2, "0")).join("");
    }
    const domaine = /(^|\.)lacleduparc\.fr$/i.test(window.location.hostname)
      ? "; Domain=.lacleduparc.fr" : "";
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = nom + "=" + identite + "; Path=/; Max-Age=34560000; SameSite=Lax" + domaine + secure;
    if (lire() !== identite) {
      throw new Error("Autorisez les cookies de l’application pour enregistrer ce navigateur.");
    }
    return identite;
  }

  autoriser.disabled=false;
})();

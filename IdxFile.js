var IdxFile = function(dataView) {
    var self = {};

    var CNT_POS = 4;
    var HEIGHT_POS = 8;
    var WIDTH_POS = 12;
    var DATA_POS = 16;

    // HACK: Force all images up to 29x29
    var IMG_WIDTH = 29;
    var IMG_HEIGHT = 29;
    var FLOAT_SIZE = IMG_WIDTH * IMG_HEIGHT * 4;
    var BYTE_SIZE = FLOAT_SIZE * 4;

    var bytes;
    var imgCnt;

    var ctor = function() {
        imgCnt = dataView.getUint32(CNT_POS);
        bytes = new ArrayBuffer(BYTE_SIZE * imgCnt);
        var height = dataView.getUint32(HEIGHT_POS);
        var width = dataView.getUint32(WIDTH_POS);

        for (var imgIdx = 0; imgIdx < imgCnt; imgIdx++) {
            loadImage(dataView, imgIdx, width, height);
        }
    };

    var loadImage = function(dataView, imgIdx, width, height) {
        var pixels = new Float32Array(bytes, 0, FLOAT_SIZE * imgCnt);
        var imgByteSize = height * width;
        var pixIdx = imgIdx * IMG_HEIGHT * IMG_WIDTH * 4;
        for (var y = 0; y < IMG_HEIGHT; y++) {
            for (var x = 0; x < IMG_WIDTH; x++) {
                var color = 0.0;
                if (y < height && x < width) {
                    color = dataView.getUint8(DATA_POS + (imgIdx * imgByteSize) + (y * width) + x) / 255.0;
                }
                pixels[pixIdx++] = color;
                pixels[pixIdx++] = color;
                pixels[pixIdx++] = color;
                pixels[pixIdx++] = 1.0;
            }
        }
    };

    self.getImage = function(imgIdx) {
        return new Float32Array(bytes, BYTE_SIZE * imgIdx, FLOAT_SIZE);
    };

    self.getImageCount = function() {
        return imgCnt;
    };

    ctor();
    return self;
};

module.exports = IdxFile;

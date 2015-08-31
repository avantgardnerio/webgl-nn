var TestPattern = function() {
    var self = {};

    var IMG_WIDTH = 29;
    var IMG_HEIGHT = 29;
    var pixels = new Float32Array(IMG_HEIGHT * IMG_WIDTH * 4);

    var ctor = function() {
        var pixIdx = 0;
        for (var y = 0; y < IMG_HEIGHT; y++) {
            for (var x = 0; x < IMG_WIDTH; x++) {
                var color = 0.0;
                if (x < 5 || y < 5 || x >= IMG_WIDTH - 5 || y >= IMG_HEIGHT - 5) {
                    color = 1.0;
                }
                pixels[pixIdx + 0] = color;
                pixels[pixIdx + 1] = color;
                pixels[pixIdx + 2] = color;
                pixels[pixIdx + 3] = 1.0;
                pixIdx += 4;
            }
        }
    };

    self.getPixels = function() {
        return pixels;
    };

    self.getWidth = function() {
        return IMG_WIDTH;
    };

    self.getHeight = function () {
        return IMG_HEIGHT;
    };

    ctor();
    return self;
};

module.exports = TestPattern;

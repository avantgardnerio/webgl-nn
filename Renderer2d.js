var js2glsl = require("js2glsl");

var Renderer2d = function(shader) {
    var self = {};

    self.render = function(gl, pixels, srcSize, dstSize, tileCount) {
        var img = new Float32Array(dstSize * dstSize * 4);
        shader.setUniforms({
            uSampler: [pixels, srcSize, srcSize],
            sourceSize: srcSize,
            destinationSize: dstSize,
            tileCount: tileCount,
            skipCount: 2.0
        });
        var varyings = {};
        for (var y = 0; y < dstSize; y++) {
            for (var x = 0; x < dstSize; x++) {
                varyings.vTextureCoord = [x / dstSize, y / dstSize];
                shader.setVaryings(varyings);
                var rgba = shader.FragmentColor(js2glsl.builtIns);
                var idx = y * dstSize * 4 + x * 4;
                for (var c = 0; c < 4; c++) {
                    img[idx + c] = rgba[c];
                }
            }
        }
        return img;
    };

    return self;
};

module.exports = Renderer2d;

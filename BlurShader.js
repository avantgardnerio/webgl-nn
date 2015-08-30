var js2glsl = require("js2glsl");


function BlurShader() {
    js2glsl.ShaderSpecification.call(this);
}

BlurShader.prototype = Object.create(js2glsl.ShaderSpecification.prototype);
BlurShader.prototype.constructor = BlurShader;

BlurShader.prototype.VertexPosition = function (builtIns) {
    var xyz = this.attributes.aVertexPosition;
    this.varyings.vTextureCoord = [
        xyz[0] / 2 + 0.5,
        xyz[1] / 2 + 0.5
    ];
    return [xyz[0], xyz[1], 0, 1];
};

BlurShader.prototype.FragmentColor = function (builtIns) {
    var val = [0, 0, 0, 0];

    var src_sz = 29.0;                      // Size of the source texture / layer / feature map
    var dst_sz = 13.0;                      // Size of the destination texture / layer / feature map
    var scale = 3.0;                        // How many patterns are tiled on the output
    var skip = 2.0;                         // Skip every other row & column
    var halfSize = 2.0;                     // "half" the kernel size
    var kernel_sz = halfSize * 2.0 + 1.0;   // Full kernel size

    // Three tiles of output per one pass over the input [0,1)
    var fmx = builtIns.mod(this.varyings.vTextureCoord[0] * scale, 1.0);
    var fmy = builtIns.mod(this.varyings.vTextureCoord[1] * scale, 1.0);

    // Round down into integer land [0,12]
    var dx = Math.floor(fmx * dst_sz);
    var dy = Math.floor(fmy * dst_sz);

    // floor((m - 5) / 2) + 1
    // 29 - 5 = 24 / 2 = 12 + 1 = 13 possible positions for the kernel within the source texture
    for (var ky = -halfSize; ky <= halfSize; ky++) {
        for (var kx = -halfSize; kx <= halfSize; kx++) {
            var sx = (dx * skip) + halfSize + kx + 0.5;
            var sy = (dy * skip) + halfSize + ky + 0.5;
            val = builtIns.addVecs4(val, builtIns.texture2D(this.uniforms.uSampler, [sx / this.uniforms.sourceSize, sy / this.uniforms.sourceSize]));
        }
    }

    // Average - TODO: Real squash function
    var k = kernel_sz * kernel_sz;
    return [val[0] / k, val[1] / k, val[2] / k, 1];
};

module.exports = BlurShader; 

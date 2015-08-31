var js2glsl = require("js2glsl");
var Texture = require('./Texture');

var Renderer3d = function(shader, vertexBuffer) {
    var self = {};

    self.render = function(gl, srcPixels, srcSize, dstSize, tileCount) {
        var srcTex = new Texture(gl, srcSize, srcSize, srcPixels);
        var dstTex = new Texture(gl, dstSize, dstSize);

        // Create and attach frame buffer
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTex.getId(), 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE");
        }

        // Init the scene
        gl.viewport(0, 0, dstSize, dstSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set the texture
        srcTex.activate(gl.TEXTURE0);

        // Upload constants
        shader.setSamplerUniform(0);
        shader.setTileCount(tileCount);
        shader.setSkipCount(2.0);
        shader.setSourceSize(srcSize);
        shader.setDestSize(dstSize);

        // Render
        vertexBuffer.draw(shader.getVertPosAttr());

        // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
        var dstPixels = new Float32Array(dstSize * dstSize * 4);
        gl.readPixels(0, 0, dstSize, dstSize, gl.RGBA, gl.FLOAT, dstPixels);
        return dstPixels;
    };

    return self;
};

module.exports = Renderer3d;

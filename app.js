var BlurWrapper = require('./BlurWrapper');
var Texture = require('./Texture');
var IdxFileReader = require('./IdxFileReader');
var TestPattern = require('./TestPattern');
var UnitVertexBuffer = require('./UnitVertexBuffer');
var js2glsl = require("js2glsl");

var shader;

var cnv3d;
var gl;
var vertexBuffer;
var cnvOut;
var ctxOut;

function webGLStart() {

    // Hook up events
    document.getElementById('test_pattern').addEventListener('click', onTestPatternClick);
    document.getElementById('fileInput').addEventListener('change', onFileOpenClick);

    cnvOut = document.getElementById("cnvOut");
    ctxOut = cnvOut.getContext("2d");

    cnv3d = document.createElement("canvas");
    cnv3d.width = 13;
    cnv3d.height = 13;
    gl = cnv3d.getContext("experimental-webgl");

    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // WebGL
    shader = new BlurWrapper(gl);
    vertexBuffer = new UnitVertexBuffer(gl);
}

function onTestPatternClick() {
    // 29x29
    var pattern = new TestPattern();
    putImageData(pattern.getPixels(), 0, 0, 29, 29);
    putImageData(pattern.getPixels(), 500, 0, 29, 29);

    // 13x13
    var img3d = draw3d(gl, pattern.getPixels(), 29, 13);
    var img2d = draw2d(gl, pattern.getPixels(), 29, 13);

    putImageData(img3d, 30, 0, 13, 13);
    putImageData(img2d, 530, 0, 13, 13);

    // TODO: Read 13x13 output, then render down to 5x5
}

function putImageData(rgba, dx, dy, width, height) {
    var img = ctxOut.createImageData(width, height);
    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
            for(var c = 0; c < 4; c++) {
                var idx = y * width * 4 + x * 4 + c;
                img.data[idx] = Math.round(Math.max(0, Math.min(255, rgba[idx] * 255)));
            }
        }
    }
    ctxOut.putImageData(img, dx, dy);
}

function onFileOpenClick(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.readAsArrayBuffer(file);
}

function onFileLoaded(e) {
    var dv = new DataView(e.target.result);
    var reader = new IdxFileReader();
    var file = reader.loadFile(dv);
    var pixels = file.getImage(0);//file.getImageCount()-1);

    var tex = new Texture(gl, file.getWidth(), file.getHeight(), pixels);

    draw3d(tex, false);
    draw2d(pixels, file.getWidth(), file.getHeight());
}

function draw2d(gl, pixels, srcSize, dstSize) {
    var img = new Float32Array(dstSize * dstSize * 4);
    shader.setUniforms({
        uSampler: [pixels, srcSize, srcSize],
        sourceSize: srcSize,
        destinationSize: dstSize,
        tileCount: 3.0,
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
}

function draw3d(gl, srcPixels, srcSize, dstSize) {
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
    shader.setTileCount(3.0);
    shader.setSkipCount(2.0);
    shader.setSourceSize(srcSize);
    shader.setDestSize(dstSize);

    // Render
    vertexBuffer.draw(shader.getVertPosAttr());

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    var dstPixels = new Float32Array(dstSize * dstSize * 4);
    gl.readPixels(0, 0, dstSize, dstSize, gl.RGBA, gl.FLOAT, dstPixels);
    return dstPixels;
}

module.exports = webGLStart;

var BlurWrapper = require('./BlurWrapper');
var Texture = require('./Texture');
var IdxFileReader = require('./IdxFileReader');
var TestPattern = require('./TestPattern');
var UnitVertexBuffer = require('./UnitVertexBuffer');
var js2glsl = require("js2glsl");

var shader;

var width = 39;
var height = 39;
var cnv3d;
var gl;
var vertexBuffer;
var cnvOut;
var ctxOut;
var cnv2d;
var ctx2d;

function webGLStart() {

    // Hook up events
    document.getElementById('test_pattern').addEventListener('click', onTestPatternClick);
    document.getElementById('fileInput').addEventListener('change', onFileOpenClick);

    cnv2d = document.createElement("canvas");
    cnv2d.width = 500;
    cnv2d.height = 500;
    ctx2d = cnv2d.getContext("2d");

    cnvOut = document.getElementById("cnvOut");
    ctxOut = cnvOut.getContext("2d");

    cnv3d = document.getElementById("cnv3d");
    gl = cnv3d.getContext("experimental-webgl");

    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // WebGL
    shader = new BlurWrapper(gl);
    vertexBuffer = new UnitVertexBuffer(gl);
}

function onTestPatternClick() {
    var pattern = new TestPattern();
    var tex = new Texture(gl, pattern.getWidth(), pattern.getHeight(), pattern.getPixels());
    draw3d(tex, false);
    var img2d = draw2d(pattern.getPixels(), pattern.getWidth(), pattern.getHeight());

    putImageData(img2d, 500, 0, pattern.getWidth(), pattern.getHeight());

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

function draw2d(pixels, width, height) {
    var img = new Float32Array(width * height * 4);
    shader.setUniforms({
        uSampler: [pixels, width, height],
        sourceSize: 29.0,
        destinationSize: 13.0,
        tileCount: 3.0,
        skipCount: 2.0
    });
    var varyings = {};
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            varyings.vTextureCoord = [x / width, y / height];
            shader.setVaryings(varyings);
            var rgba = shader.FragmentColor(js2glsl.builtIns);
            var idx = y * width * 4 + x * 4;
            for (var c = 0; c < 4; c++) {
                img[idx + c] = rgba[c];
            }
        }
    }
    return img;
}

function draw3d(texture, fbo) {

    // Optionally render to frame buffer
    if (fbo) {
        // Create output texture
        var tex = new Texture(gl, width, height);

        // Create and attach frame buffer
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.getId(), 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE");
        }
    }

    // Init the scene
    gl.viewport(0, 0, cnv3d.width, cnv3d.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the texture
    texture.activate(gl.TEXTURE0);

    // Upload constants
    shader.setSamplerUniform(0);
    shader.setTileCount(3.0);
    shader.setSkipCount(2.0);
    shader.setSourceSize(29.0);
    shader.setDestSize(13.0);

    // Render
    vertexBuffer.draw(shader.getVertPosAttr());

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    if (fbo) {
        var pixels = new Float32Array(4 * width * height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
        console.log(pixels[0] + "," + pixels[1] + "," + pixels[2] + "," + pixels[3]);
    }
}

module.exports = webGLStart;

var BlurShader = require('./BlurShader');
var IdxFileReader = require('./IdxFileReader');
var TestPattern = require('./TestPattern');
var UnitVertexBuffer = require('./UnitVertexBuffer');
var js2glsl = require("js2glsl");

var shaderSpec = new BlurShader();

var width = 39;
var height = 39;
var canvas;
var gl;
var shaderProgram;
var vertexBuffer;

function webGLStart() {

    // Hook up events
    document.getElementById('test_pattern').addEventListener('click', onTestPatternClick);
    document.getElementById('fileInput').addEventListener('change', onFileOpenClick);
    canvas = document.getElementById("lesson05-canvas");
    gl = canvas.getContext("experimental-webgl");

    // WebGL
    initShaders();
    vertexBuffer = new UnitVertexBuffer(gl);

    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

// TODO: Refactor and kill
function initShaders() {
    shaderProgram = shaderSpec.GetProgram(gl)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

    shaderProgram.tileCount = gl.getUniformLocation(shaderProgram, "tileCount");
    shaderProgram.skipCount = gl.getUniformLocation(shaderProgram, "skipCount");
    shaderProgram.sourceSize = gl.getUniformLocation(shaderProgram, "sourceSize");
    shaderProgram.destinationSize = gl.getUniformLocation(shaderProgram, "destinationSize");
}

function onTestPatternClick() {
    var pattern = new TestPattern();
    var tex = createTexture(pattern.getPixels(), pattern.getWidth(), pattern.getHeight());
    drawScene(tex, false);
    draw2D(pattern.getPixels(), pattern.getWidth(), pattern.getHeight());

    // TODO: Read 13x13 output, then render down to 5x5
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

    var tex = createTexture(pixels, file.getWidth(), file.getHeight());
    //var tmp = new Float32Array(srcImgbytes, IMG_BYTE_SZ * (imageCount-1), IMG_FLT_SZ);
    //replaceTexture(tex, tmp, file.getWidth(), file.getHeight());

    drawScene(tex, false);
    draw2D(pixels, file.getWidth(), file.getHeight());
}

function draw2D(pixels, width, height) {
    var canvas2d = document.getElementById("2d");
    var ctx = canvas2d.getContext("2d");

    var w = canvas2d.width;
    var h = canvas2d.height;
    var sw = 500;
    var sh = 500;
    var img = ctx.createImageData(w, h);

    shaderSpec.uniforms = {
        uSampler: [pixels, width, height],
        sourceSize: 29.0,
        destinationSize: 13.0,
        tileCount: 3.0,
        skipCount: 2.0
    };
    shaderSpec.varyings = {};
    for (var x = 0; x <= sw; x++) {
        for (var y = 0; y <= sh; y++) {
            shaderSpec.varyings.vTextureCoord = [x / w, y / h];
            var rgba = shaderSpec.FragmentColor(js2glsl.builtIns);
            var idx = (x + (h - y - 1) * w) * 4;
            for (var c = 0; c < 4; c++) {
                img.data[idx + c] = Math.round(Math.max(0, Math.min(255, rgba[c] * 255)));
            }
            img.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function drawScene(texture, fbo) {

    // Optionally render to frame buffer
    if (fbo) {
        // Create output texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);

        // Create and attach frame buffer
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE");
        }
    }

    // Draw the scene
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    // Upload constants
    gl.uniform1f(shaderProgram.tileCount, 3.0);
    gl.uniform1f(shaderProgram.skipCount, 2.0);
    gl.uniform1f(shaderProgram.sourceSize, 29.0);
    gl.uniform1f(shaderProgram.destinationSize, 13.0);

    vertexBuffer.draw(shaderProgram.vertexPositionAttribute);

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    if (fbo) {
        var pixels = new Float32Array(4 * width * height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
        console.log(pixels[0] + "," + pixels[1] + "," + pixels[2] + "," + pixels[3]);
    }
}

function replaceTexture(tex, floatAr, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 	// target - Specifies the target texture
        0, 							// level - The level of detail value.
        gl.RGBA, 					// internalformat - Specifies the number of color components in the texture.
        width, 						// width - Width of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
        height, 					// height - Height of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
        0, 							// border - Specifies the width of the border. Must be 0.
        gl.RGBA, 					// format - Contains the format for the source pixel data. Must match internalformat (see above).
        gl.FLOAT,					// type - The type of texture data. (gl.FLOAT creates 128 bit-per-pixel textures instead of 32 bit-per-pixel for the image)
        floatAr						// pixels - The ImageData array, ArrayBufferView, HTMLCanvasElement, HTMLImageElement to use as a data source for the texture.
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// TODO: Texture manage that can avoid reallocating textures all the time
function createTexture(floatAr, width, height) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 	// target - Specifies the target texture
        0, 							// level - The level of detail value.
        gl.RGBA, 					// internalformat - Specifies the number of color components in the texture.
        width, 						// width - Width of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
        height, 					// height - Height of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
        0, 							// border - Specifies the width of the border. Must be 0.
        gl.RGBA, 					// format - Contains the format for the source pixel data. Must match internalformat (see above).
        gl.FLOAT,					// type - The type of texture data. (gl.FLOAT creates 128 bit-per-pixel textures instead of 32 bit-per-pixel for the image)
        floatAr						// pixels - The ImageData array, ArrayBufferView, HTMLCanvasElement, HTMLImageElement to use as a data source for the texture.
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return tex;
}

module.exports = webGLStart;

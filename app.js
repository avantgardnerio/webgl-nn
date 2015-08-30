var BlurShader = require('./BlurShader');
var js2glsl = require("js2glsl");

var shaderSpec = new BlurShader();


var IMG_WIDTH = 29;
var IMG_HEIGHT = 29;
var IMG_FLT_SZ = IMG_WIDTH * IMG_HEIGHT * 4;
var IMG_BYTE_SZ = IMG_FLT_SZ * 4;

var srcImgbytes;

var width = 39;
var height = 39;
var gl;
var shaderProgram;
var floatTexture;
var vertexBuffer;

function createTestPattern() {

}

function webGLStart() {
    var testPatternButton = document.getElementById('test_pattern');
    testPatternButton.addEventListener('click', function (e) {
        // Test stripes for alignment
        var pixels = new Float32Array(IMG_HEIGHT * IMG_WIDTH * 4);
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

        draw2D(pixels);
        var tex = createTexture(pixels, IMG_WIDTH, IMG_HEIGHT);
        //var tmp = new Float32Array(srcImgbytes, IMG_BYTE_SZ * (imageCount-1), IMG_FLT_SZ);
        //replaceTexture(tex, tmp, IMG_WIDTH, IMG_HEIGHT);
        drawScene(tex, false);

    });

    // File reader
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function (e) {
        var file = fileInput.files[0];

        var reader = new FileReader();

        reader.onload = function (e) {
            var dv = new DataView(reader.result);
            var pos = -4;
            var magic = dv.getUint32(pos += 4);
            console.log("magic=" + magic);

            // Image file
            if (magic == 2051) {
                var imageCount = dv.getUint32(pos += 4);
                var rowCount = dv.getUint32(pos += 4);
                var colCount = dv.getUint32(pos += 4);
                console.log("imageCount=" + imageCount);
                console.log("rowCount=" + rowCount);
                console.log("colCount=" + colCount);
                srcImgbytes = new ArrayBuffer(IMG_BYTE_SZ * imageCount);
                var pixels = new Float32Array(srcImgbytes, 0, IMG_FLT_SZ * imageCount);
                var pixIdx = 0;

                var imgByteSize = rowCount * colCount;
                for (var imgIdx = 0; imgIdx < imageCount; imgIdx++) {
                    for (var y = 0; y < IMG_HEIGHT; y++) {
                        for (var x = 0; x < IMG_WIDTH; x++) {
                            var color = 0.0;
                            if (y < rowCount && x < colCount) {
                                color = dv.getUint8(pos + (imgIdx * imgByteSize) + (y * colCount) + x) / 255.0;
                            }
                            pixels[pixIdx + 0] = color;
                            pixels[pixIdx + 1] = 0;
                            pixels[pixIdx + 2] = 0;
                            pixels[pixIdx + 3] = 1.0;
                            pixIdx += 4;
                        }
                    }
                }

                draw2D(pixels);
                var tex = createTexture(pixels, IMG_WIDTH, IMG_HEIGHT);
                //var tmp = new Float32Array(srcImgbytes, IMG_BYTE_SZ * (imageCount-1), IMG_FLT_SZ);
                //replaceTexture(tex, tmp, IMG_WIDTH, IMG_HEIGHT);
                drawScene(tex, false);
            }

            // Label file
            if (magic == 2049) {
                var lblCnt = dv.getUint32(pos += 4);
                for (var lblIdx = 0; lblIdx < lblCnt; lblIdx++) {
                    var lbl = dv.getUint8(pos + lblIdx);
                    console.log("lbl=" + lbl);
                }
            }
        }

        reader.readAsArrayBuffer(file);
    });

    // WebGL
    var canvas = document.getElementById("lesson05-canvas");
    initGL(canvas);
    initShaders();
    vertexBuffer = createSquareVertexBuffer();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    drawScene(floatTexture, false);

}

function draw2D(pixels) {
    var canvas2d = document.getElementById("2d");
    ctx = canvas2d.getContext("2d");

    var w = canvas2d.width;
    var h = canvas2d.height;
    var sw = 500;
    var sh = 500;
    var img = ctx.createImageData(w, h);

    shaderSpec.uniforms = {
        uSampler: [pixels, IMG_WIDTH, IMG_HEIGHT],
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

function initGL(canvas) {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
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
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    // Upload constants
    gl.uniform1f(shaderProgram.tileCount, 3.0);
    gl.uniform1f(shaderProgram.skipCount, 2.0);
    gl.uniform1f(shaderProgram.sourceSize, 29.0);
    gl.uniform1f(shaderProgram.destinationSize, 13.0);

    drawVertexBuffer(shaderProgram.vertexPositionAttribute, vertexBuffer);

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    if (fbo) {
        var pixels = new Float32Array(4 * width * height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
        console.log(pixels[0] + "," + pixels[1] + "," + pixels[2] + "," + pixels[3]);
    }
}

function drawVertexBuffer(vertPosAttr, vertBuff) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
    gl.vertexAttribPointer(vertPosAttr, vertBuff.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertBuff.numItems / 2);
}

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

function initTexture() {
    gl.getExtension('OES_texture_float');

    // Draw texture
    var ar = new Float32Array(width * height * 4);
    for (var i = 0; i < width * height; i++) {
        ar[i * 4 + 0] = 0.5;
        ar[i * 4 + 1] = 0.5;
        ar[i * 4 + 2] = 1;
        ar[i * 4 + 3] = 1;
    }

    draw2D(ar);
    // Upload texture to GPU
    floatTexture = createTexture(ar, width, height);
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

function createSquareVertexBuffer() {
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var vertAr = [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertAr), gl.STATIC_DRAW);
    vertexBuffer.itemSize = 2;
    vertexBuffer.numItems = vertAr.length;

    return vertexBuffer;
}

module.exports = webGLStart;

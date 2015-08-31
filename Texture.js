function Texture(gl, width, height, floatAr) {
    var self = {};

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

    self.getId = function() {
        return tex;
    };

    self.activate = function(dst) {
        gl.activeTexture(dst);
        gl.bindTexture(gl.TEXTURE_2D, self.getId());
    };

    return self;
}

module.exports = Texture;

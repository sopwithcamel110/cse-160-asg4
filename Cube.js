class Cube {
    constructor(rgba = [1.0, 1.0, 1.0, 1.0]) {
        this.color = [rgba[0]/255,rgba[1]/255,rgba[2]/255,1];
        this.matrix = new Matrix4();
        this.textureNum=-2;
    }

    render() {
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        drawTriangle3DUV([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0], [1, 0, 0, 1, 0, 0]);
        drawTriangle3DUV([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0], [1, 0, 1, 1, 0, 1]);
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);

        gl.uniform4f(u_FragColor, rgba[0] * .90, rgba[1] * .90, rgba[2] * .90, rgba[3]);
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

        drawTriangle3DUV([0, 0, 0, 0, 0, 1, 1, 0, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 0, 1, 1, 1, 0]);

        gl.uniform4f(u_FragColor, rgba[0] * .80, rgba[1] * .80, rgba[2] * .80, rgba[3]);

        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 0, 1, 1, 0]);
        drawTriangle3DUV([0, 1, 1, 0, 1, 0, 0, 0, 1], [1, 1, 0, 1, 1, 0]);
 
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 1, 0], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0]);
 
        gl.uniform4f(u_FragColor, rgba[0] * .70, rgba[1] * .70, rgba[2] * .70, rgba[3]);
    }
    renderfast(){
        var rgba = this.color;
        //pass the texture Number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts = [];
        //front
        allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
        allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);
        //back
        allverts = allverts.concat([0,0,1, 1,1,1, 1,0,1]);
        allverts = allverts.concat([0,0,1, 0,1,1, 1,1,1]);
        //top
        allverts = allverts.concat([0,1,0, 1,1,0, 1,1,1]);
        allverts = allverts.concat([0,1,1, 0,1,0, 1,1,1]);
        //bottom
        allverts = allverts.concat([0,0,0, 0,0,1, 1,0,0]);
        allverts = allverts.concat([1,0,0, 1,0,1, 0,0,1]);
        //left
        allverts = allverts.concat([0,0,0, 0,1,0, 0,1,1]);
        allverts = allverts.concat([0,1,1, 0,0,0, 0,0,1]);
        //right
        allverts = allverts.concat([1,1,0, 1,1,1, 1,0,0]);
        allverts = allverts.concat([1,0,0, 1,1,1, 1,0,1]);
        drawTriangle3D(allverts);
    }
}
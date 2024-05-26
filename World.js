// Donovan deVise
// Assignment 3
// CSE 160

var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`


// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    uniform vec3 u_lightPos;
    uniform vec3 u_cameraPos;
    varying vec4 v_VertPos;
    uniform bool u_lightOn;
    uniform vec4 u_lightColor;


  void main() {
    if (u_whichTexture == -2) {                   // Use color
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {            // Use UV debug color
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0) {             // Use texture0
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == -3) {             // Use texture1
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if(u_whichTexture==-4){                  //use normal
      gl_FragColor = vec4( (v_Normal + 1.0)/2.0, 1.0);
    } else {                                      // Error, put Redish
      gl_FragColor = vec4(1,.2,.2,1);
    }
    
    vec3 lightVector = vec3(v_VertPos) - u_lightPos;
    float r = length(lightVector);
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);
   
     //Reflection
    vec3 R = reflect(-L,N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
    float specular = pow(max(dot(E,R), 0.0), 64.0) * 0.8;
    vec3 diffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * nDotL *0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.2;
    if(u_lightOn){
      gl_FragColor =vec4(specular+diffuse+ambient,1.0)*u_lightColor;
    }else{
      gl_FragColor =vec4(diffuse+ambient,1.0);
    }
  }`;

let u_Size, u_ModelMatrix, u_GlobalRotateMatrix, canvas, gl, a_Position, u_FragColor;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;
let camera;
let a_UV;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_lightColor;


function setupWebGL() {
    canvas = document.getElementById('webgl');
    
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log("failed to get rendering content of web gl.");
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("failed to initialize shaders.");
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('failed to get the storage location of a_UV');
        return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('failed to get the storage location of a_Normal');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log('Failed to get the storage location of u_lightPos');
        return;
    }

    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
        console.log('Failed to get the storage location of u_cameraPos');
        return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log('Failed to get the storage location of u_lightOn');
        return;
    }


    u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
    if (!u_lightColor) {
        console.log('Failed to get teh storage location of u_lightColor');
        return;
    }

    //get the storage location of u_ModeMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log("Failed ti get the storage location of u_ModelMatrix");
        return;
    }

    //get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("Failed ti get the storage location of u_GlobalRotateMatrix");
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }
    //get the storage location of u_global_rotation_matrix
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }
    //set an initial value for this matrix to identity
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    image.onload = function () {
        sendImagetoTEXTURE0(image);
    };
    image.src = 'sky.png';
    

    return true;
}
function initTextures1() {
    var image1 = new Image();
    image1.onload = function () {
        sendImagetoTEXTURE1(image1);
    };
    image1.src = 'ground.jpg';
    return true;
}

function sendImagetoTEXTURE0(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler0, 0);
    console.log('finished loadTexture');
}
function sendImagetoTEXTURE1(image1) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
    gl.uniform1i(u_Sampler1, 1);
    console.log('finished loadTexture');
}

let g_globalAngle = 0;

let g_thighAngle = 0;
let g_lowerLegAngle = 0;
let g_bodyAngle = 0;
let g_headAngle = 0;
let g_headAngle1 = 0;
let g_wingAngle = 0;
let g_animation = false;
let shift = false;


function addActionsForHtmlUI() {
    document.getElementById('animationOff').onclick = function () {
        g_animation = false;
    };
    document.getElementById('animationOn').onclick = function () {
        g_animation = true;
    };

    document.getElementById('thighSlide').addEventListener('mousemove', function () {
        g_thighAngle = this.value;
        renderAllShapes();
    });
    document.getElementById('lowerLegSlide').addEventListener('mousemove', function () {
        g_lowerLegAngle = this.value;
        renderAllShapes();
    });
    document.getElementById('bodyslide').addEventListener('mousemove', function () {
        g_bodyAngle = this.value;
        renderAllShapes();
    });

    document.getElementById('headslide').addEventListener('mousemove', function () {
        g_headAngle = this.value;
        g_headAngle1 = this.value * 10;
        renderAllShapes();
    });

    document.getElementById('angleSlide').addEventListener('mousemove', function () {
        g_globalAngle = this.value;
        renderAllShapes();
    });

    document.getElementById('lightSlideX').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[0] = this.value / 100;
            renderAllShapes();
        }
    });
    document.getElementById('lightSlideY').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[1] = this.value / 100;
            renderAllShapes();
        }
    });
    document.getElementById('lightSlideZ').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[2] = this.value / 100;
            renderAllShapes();
        }
    });
    document.getElementById('lightOn').onclick = function() {
        g_lightOn = !g_lightOn;
    };
    document.getElementById('lightOff').onclick = function() {
        g_lightOn = !g_lightOn;
    };
    document.getElementById('normalOn').onclick = function () {
        g_normalOn = true;
    };
    document.getElementById('normalOff').onclick = function () {
        g_normalOn = false;
    };

    document.getElementById('L_C_S_R').addEventListener('mousemove', function(ev) {
        if(ev.buttons == 1){
            g_lightColor[0] = this.value/255;
        }
    });
    document.getElementById('L_C_S_G').addEventListener('mousemove', function(ev) {
        if(ev.buttons == 1){
            g_lightColor[1] = this.value/255;

        }
    });
    document.getElementById('L_C_S_B').addEventListener('mousemove', function(ev) {
        if(ev.buttons == 1){
            g_lightColor[2] = this.value/255;
        }
    });
}

function main() {
    setupWebGL();
    
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    camera = new Camera();
    document.onkeydown = keydown;
    initTextures();
    initTextures1();

    initEventHandlers(canvas, currentAngle);
    
    gl.clearColor(0 / 255, 0 / 255, 0 / 255, 1.0);
    
    requestAnimationFrame(tick);
}

function initEventHandlers(canvas, currentAngle) {
    var dragging = false; 
    var lastX = -1, lastY = -1; 
    canvas.onmousedown = function (ev) { 
        var x = ev.clientX, y = ev.clientY;
        
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    
    canvas.onmouseup = function (ev) {
        dragging = false;
    };
    canvas.onmousemove = function (ev) { 
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100 / canvas.height;
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            
            camera.panHorizontal_Mouse((lastX-x)/3);
            camera.panVertical_Mouse((lastY-y));
        }
        lastX = x;
        lastY = y;
    };
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now() / 500.0 - g_startTime;

    updateAnimationAngles();

    renderAllShapes();

    requestAnimationFrame(tick);
    g_lightPos[0] = Math.cos(g_seconds/10)*10;
}

function updateAnimationAngles() {
    if (g_animation == true) {
        g_thighAngle = (8 * Math.sin(g_seconds));
        g_lowerLegAngle = -(6 * Math.sin(g_seconds));
        g_bodyAngle = 2 * (Math.sin(g_seconds));
        g_headAngle = 4 * (Math.sin(g_seconds));
        g_headAngle1 = 10000 * (Math.sin(g_seconds));
        g_wingAngle = 10 * (Math.sin(g_seconds));
    }
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; 
    var y = ev.clientY; 
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    return ([x, y]);
}

var currentAngle = [0.0, 0.0];

function keydown(ev) {
    if (ev.keyCode == 65) { 
        camera.moveRight();
    } else if (ev.keyCode == 68) { 
        camera.moveLeft();
    } else if (ev.keyCode == 87) { 
        camera.moveForward();
    } else if (ev.keyCode == 83) { 
        camera.moveBackwards();
    } else if (ev.keyCode == 81) { 
        camera.panLeft();
    } else if (ev.keyCode == 69) { 
        camera.panRight();
    }
    renderAllShapes();
}

var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];
var g_map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
];

function drawMap() {
    for (x = 0; x < 32; x++) {
        for (y = 0; y < 32; y++) {
            let height = g_map[x][y];
            for (i = 0; i < height; i++) {
                var body = new Cube();
                if (height === 1) {
                    body.color = [0, 0, 0, 1];
                }
                if (height === 2) {
                    body.color = [255, 0, 0, 1]
                }
                else if (height === 3) {
                    body.color = [255, 255, 0, 1]
                }
                body.matrix.translate(x - 4, -0.545 + i, y - 4);
                body.renderfast();
            }
        }
    }

}

function renderAllShapes() {
    var startTime = performance.now();

    var projMat = camera.projMat;
    
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = camera.viewMat;
    
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(currentAngle[0], 1.0, 0.0, 0.0);
    globalRotMat.rotate(currentAngle[1], 0.0, 1.0, 0.0);
    globalRotMat.rotate(g_globalAngle, 0.0, 1.0, 0.0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(u_cameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
    gl.uniform1i(u_lightOn, g_lightOn);
    gl.uniform4f(u_lightColor, ...g_lightColor);

    renderScene();
    var duration = performance.now() - startTime;
    sendTextToHTML("ms:" + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "perfmonitor");
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Fail to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

let g_normalOn = false;
let g_lightPos = [2, 1, 0]
let g_lightOn = true;
let g_lightColor=[1,1,1,1];

function renderScene() {
    var light = new Cube();
    light.textureNum = -4;
    light.color = g_lightColor;
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-1, -1, -1);
    light.matrix.translate(-.5, -3, -.5);
    light.render();

    let sphere = new Sphere();
    if (g_normalOn) sphere.textureNum = -4;
    sphere.matrix.setScale(1, 1, 1);
    sphere.matrix.translate(2, 1, -1);
    sphere.render();

    var skybox = new Cube();
    skybox.color = [1, 0, 0, 1.0];
    skybox.textureNum = 0;
    if (g_normalOn) {
        skybox.textureNum = -4;
    }
    skybox.matrix.scale(-30, -30, -30);
    skybox.matrix.translate(-0.5, -0.545, -0.5);
    skybox.render();

    var ground = new Cube();
    ground.textureNum = -3;
    if (g_normalOn) {
        ground.textureNum = -4;
    }
    ground.matrix.translate(-200, -0.545, -200);
    ground.matrix.scale(500, 0.01, 500);
    ground.render();

    var body = new Cube([255,255,255]);
    body.matrix.translate(0.5, -0.25, 0);
    body.matrix.rotate(90, 0, 0, 1);
    body.matrix.rotate(g_bodyAngle, 0, 0, 1);
    body.matrix.scale(0.5, 0.5, 0.5);
    body.render();
    var leftWing = new Cube([255,255,255]);
    leftWing.matrix = new Matrix4(body.matrix)
    leftWing.matrix.translate(0.8,0.3,1);
    leftWing.matrix.rotate(90, 0, 0, 1);
    if (shift == false) {
        leftWing.matrix.rotate(0, 0, g_wingAngle, 1);
    } else {
        leftWing.matrix.rotate(g_headAngle1, 1, 1, 0)
    }
    leftWing.matrix.scale(0.5, 0.5, 0.2);
    leftWing.render();
    var rightWing = new Cube([255,255,255]);
    rightWing.matrix = new Matrix4(body.matrix)
    rightWing.matrix.translate(0.8,0.3,-0.2);
    rightWing.matrix.rotate(90, 0, 0, 1);
    if (shift == false) {
        rightWing.matrix.rotate(0, 0, g_wingAngle, 1);
    } else {
        rightWing.matrix.rotate(g_headAngle1, 1, 1, 0)
    }
    rightWing.matrix.scale(0.5, 0.5, 0.2);
    rightWing.render();
    
    var B_L_Upper_Leg = new Cube([245,186,29]);
    B_L_Upper_Leg.matrix.translate(0.35, -0.4, 0.20);
    B_L_Upper_Leg.matrix.scale(0.15, 0.25, 0.1);
    B_L_Upper_Leg.matrix.rotate(180, 0, 1, 0);
    B_L_Upper_Leg.matrix.rotate(g_thighAngle, 0, 0, 1);
    var B_L_Coor = new Matrix4(B_L_Upper_Leg.matrix);
    B_L_Upper_Leg.render();
    var B_L_Lower_Leg = new Cube([245,186,29]);
    B_L_Lower_Leg.matrix = B_L_Coor;
    B_L_Lower_Leg.matrix.translate(0.25, -0.4, 0.25);
    B_L_Lower_Leg.matrix.scale(0.5, 0.6, 0.5);
    B_L_Lower_Leg.matrix.rotate(g_lowerLegAngle, 0, 0, 1);
    var B_L_Foot_Coor = new Matrix4(B_L_Lower_Leg.matrix);
    B_L_Lower_Leg.render();
    var B_L_Foot = new Cube([245,186,29]);
    B_L_Foot.matrix = B_L_Foot_Coor;
    B_L_Foot.matrix.translate(-0.25, -0.15, -0.7);
    B_L_Foot.matrix.scale(1.5, 0.15, 2.5);
    B_L_Foot.render();

    var B_R_Upper_Leg = new Cube([245,186,29]);
    B_R_Upper_Leg.matrix.translate(0.35, -0.4, 0.40);
    B_R_Upper_Leg.matrix.scale(0.15, 0.25, 0.1);
    B_R_Upper_Leg.matrix.rotate(180, 0, 1, 0);
    B_R_Upper_Leg.matrix.rotate(g_thighAngle, 0, 0, 1);
    var B_R_Coor = new Matrix4(B_R_Upper_Leg.matrix);
    B_R_Upper_Leg.render();
    var B_R_Lower_Leg = new Cube([245,186,29]);
    B_R_Lower_Leg.matrix = B_R_Coor;
    B_R_Lower_Leg.matrix.translate(0.25, -0.4, 0.25);
    B_R_Lower_Leg.matrix.scale(0.5, 0.6, 0.5);
    B_R_Lower_Leg.matrix.rotate(g_lowerLegAngle, 0, 0, 1);
    var B_R_Foot_Coor = new Matrix4(B_R_Lower_Leg.matrix);
    B_R_Lower_Leg.render();
    var B_R_Foot = new Cube([245,186,29]);
    B_R_Foot.matrix = B_R_Foot_Coor;
    B_R_Foot.matrix.translate(-0.25, -0.15, -0.7);
    B_R_Foot.matrix.scale(1.5, 0.15, 2.5);
    B_R_Foot.render();
    
    var head = new Cube([255,255,255])
    head.matrix.setTranslate(0, 0.05, 0.04)
    head.matrix.rotate(90, 0, 0, 1)
    head.matrix.rotate(g_headAngle, 0, 0, 1)
    head.matrix.scale(0.3, 0.15, 0.4);
    head.render();
    var beak = new Cube([245,186,29])
    beak.matrix = new Matrix4(head.matrix)
    beak.matrix.translate(0.1, 1, 0.25)
    beak.matrix.scale(0.5, 0.8, 0.5)
    beak.render()
    var watt = new Cube([255,0,0])
    watt.matrix = new Matrix4(head.matrix)
    watt.matrix.translate(0, 1, 0.3)
    watt.matrix.scale(0.5, 0.5, 0.4)
    watt.render()
    var leftEye = new Cube([0,0,0])
    leftEye.matrix = new Matrix4(head.matrix)
    leftEye.matrix.translate(0.7, 1, 0.7)
    leftEye.matrix.scale(0.2,0.2,0.2)
    leftEye.render()
    var rightEye = new Cube([0,0,0])
    rightEye.matrix = new Matrix4(head.matrix)
    rightEye.matrix.translate(0.7, 1, 0.1)
    rightEye.matrix.scale(0.2,0.2,0.2)
    rightEye.render()

    
    var tail = new Triangle();
    tail.color = [1,1,1, 1.0];
    tail.matrix.translate(0.45, 0., 0.2);
    tail.matrix.rotate(270, 0, 0, 1);
    tail.matrix.rotate(g_bodyAngle, 0, 0, 1);
    tail.matrix.scale(0.15, 0.1, 0.4);
    tail.render();
}

function funcShiftKey(event) {
    if (event.shiftKey) {
        
        shift = true;
    } else {
        shift = false;
    }
}

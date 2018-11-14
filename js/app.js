// It's a pain to laod in from a file, so we're going to make
// the vertex shader a big string, combining it with linebreaks
var vertexShaderText =
[
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec3 vertColor;',
'attribute vec2 vertTexCoord;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'',
'varying vec2 fragTexCoord;',
'',
'void main()',
'{',
' fragTexCoord = vertTexCoord;',
' gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

// In OpenGL, the matrices are applied in right-to-left order.
// mWorld changes in 3D space
// mView shows where our camera is sitting at
// mProj is our projection matrix and it... uh... does something I guess

// fragColor is output of vertex shader, and inpute on frag shader
// Samplers are in order. sampler is texture 0
var fragmentShaderText =
[
'precision mediump float;',
'',
'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',
'',
'void main()',
'{',
' gl_FragColor = texture2D(sampler, fragTexCoord);',
'}'
].join("\n");

var init = function() {
  //console.log("Bubsy.");

  var canvas = document.getElementById("game_surface");
  var gl = canvas.getContext("webgl");

  // We're using IE or older version of Edge
  if (!gl){
    console.log("WebGL not supported, falling back to experimental-webgl");
    gl = canvas.getContext('experimental-webgl');
  }

  // Else, the browser doesn't support WebGL at all
  if (!gl){
    alert("Your browser does not support WebGL");
  }

  gl.clearColor(0.3,0.3,0.3,1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);


  // Creating shaders

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader,vertexShaderText);
  gl.shaderSource(fragShader, fragmentShaderText);

  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
    console.error("ERROR compiling vertex shader", gl.getShaderInfoLog(vertexShader));
    return;
  }

  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader,gl.COMPILE_STATUS)){
    console.error("ERROR compiling fragment shader", gl.getShaderInfoLog(fragShader));
    return;
  }

  // Entire graphics pipeline
  var program = gl.createProgram();
  // Takes in a program you want to attach the shader to, and the shader
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);

  // After we compile, we have to link
  gl.linkProgram(program)

  // Check for linker errors
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)){
    console.error("ERROR linking program", gl.getProgramInfoLog(program));
    return;
  }

  // Only want to do this in testing:
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
    console.error("ERROR validating program",gl.getProgramInfoLog(program));
    return;
  }

  //
  // Creating buffers
  //

  /*
  var triangleVerts =
  [
    // X, Y, Z      R, G, B
    0.0,0.5,0.0,    1.0,1.0,0.0,
    -0.5,-0.5,0.0,  0.7,0.0,1.0,
    0.5,-0.5,0.0,   0.1,1.0,0.6
  ];
  */
  var cubeVerts =
  [
    // X Y Z         U V
    // Top
    -1.0,1.0,-1.0,   0, 0,
    -1.0,1.0,1.0,    0, 1,
    1.0,1.0,1.0,     1, 1,
    1.0,1.0,-1.0,    1, 0,

    // Left
    -1.0,1.0,1.0,    0, 0,
    -1.0,-1.0,1.0,   1, 0,
    -1.0,-1.0,-1.0,  1, 1,
    -1.0,1.0,-1.0,   0, 1,

    // Right
    1.0,1.0,1.0,     1, 1,
    1.0,-1.0,1.0,    0, 1,
    1.0,-1.0,-1.0,   0, 0,
    1.0,1.0,-1.0,    1, 0,

    // Front
    1.0,1.0,1.0,     1, 1,
    1.0,-1.0,1.0,    1, 0,
    -1.0,-1.0,1.0,   0, 0,
    -1.0,1.0,1.0,    0, 1,

    // Back
    1.0,1.0,-1.0,    0, 0,
    1.0,-1.0,-1.0,   0, 1,
    -1.0,-1.0,-1.0,  1, 1,
    -1.0,1.0,-1.0,   1, 0,

    // Bottom
    -1.0,-1.0,-1.0,  1, 1,
    -1.0,-1.0,1.0,   1, 0,
    1.0,-1.0,1.0,    0, 0,
    1.0,-1.0,-1.0,   0, 1

  ];

  cubeIndices =
  [
    // Top
    0, 1, 2,
    0, 2, 3,

    // Left
    5, 4, 6,
    6, 4, 7,

    // Right
    8, 9, 10,
    8, 10, 11,

    // Front
    13, 12, 14,
    15, 14, 12,

    // Back
    16, 17, 18,
    16, 18, 19,

    // Bottom
    21, 20, 22,
    22, 20, 23
  ]

  // A buffer is a chunk of memory allocated for some purpose.
  // We're allocating memory on the GPU by creating a buffer
  var cubeVertexBufferObject = gl.createBuffer();

  // Setting the active buffer to an array buffer, and binding the buffer we created to it
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);

  // Specify the data on the active buffers; Whatever buffer we last bound
  // JS stores data in 64 bit, but WebGL expects 32 bit floats
  // STATIC_DRAW means we're sending from the CPU memory to GPU memory and not changing it.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);

  var cubeIndexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);  // We're not storing indices as floats, but unsigned ints

  // name of the attribute we're using in our shader is second parameter
  var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
  var texCoordAttribLocation = gl.getAttribLocation(program, "vertTexCoord");
  gl.vertexAttribPointer (
    positionAttribLocation,              // attribute location
    3,                                   // Number of elements per attribute
    gl.FLOAT,                            // Type of elements
    gl.FALSE,
    5 * Float32Array.BYTES_PER_ELEMENT,  // Size of an individual vertex
    0                                    // Offset from the beginning of a single vertex to this attribute
  );


  gl.vertexAttribPointer (
    texCoordAttribLocation,                 // attribute location
    2,                                   // Number of elements per attribute
    gl.FLOAT,                            // Type of elements
    gl.FALSE,
    5 * Float32Array.BYTES_PER_ELEMENT,  // Size of an individual vertex
    3 * Float32Array.BYTES_PER_ELEMENT   // Offset from the beginning of a single vertex to this attribute
  );


  /*
  gl.vertexAttribPointer (
    colorAttribLocation,                 // attribute location
    3,                                   // Number of elements per attribute
    gl.FLOAT,                            // Type of elements
    gl.FALSE,
    6 * Float32Array.BYTES_PER_ELEMENT,  // Size of an individual vertex
    3 * Float32Array.BYTES_PER_ELEMENT   // Offset from the beginning of a single vertex to this attribute
  );
  */

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(texCoordAttribLocation);

  //
  // Create texture
  //

  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("crate-image"));

  gl.bindTexture(gl.TEXTURE_2D, null);

  // Tell WebGL state machine the program should be active
  gl.useProgram(program);

  // Allocating space on the GPU memory
  var matWorldUniformLocation = gl.getUniformLocation(program,"mWorld");
  var matViewUniformLocation = gl.getUniformLocation(program,"mView");
  var matProjUniformLocation = gl.getUniformLocation(program,"mProj");

  // Setting up variables in CPU memory
  var worldMatrix = new Float32Array(16);
  var viewMatrix = new Float32Array(16);
  var projMatrix = new Float32Array(16);

  mat4.identity(worldMatrix);
  mat4.lookAt(viewMatrix, [0,0,-8],[0,0,0],[0,1,0]);
  mat4.perspective(projMatrix, glMatrix.toRadian(45),canvas.width/canvas.height,0.1,1000.0);

  // Now we're transfering the CPU memory to the GPU
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);



  var xRotationMatrix = new Float32Array(16);
  var yRotationMatrix = new Float32Array(16);

  //
  // Main render loop
  // In a game this would be a while loop
  // For now, we're just drawing triangle.
  //
  var identityMatrix = new Float32Array(16);
  mat4.identity(identityMatrix);
  var angle = 0;

  var loop = function () {

      angle = performance.now() / 1000 / 6 * 2 * Math.PI; // One full rotation (2Pi) every 6 seconds

      mat4.rotate(yRotationMatrix,identityMatrix,angle,[0,1,0]); // Rotate World Matrix about the Identity Matrix by angle degrees on the y-axis
      mat4.rotate(xRotationMatrix,identityMatrix,angle/4,[1,0,0]); // Rotate World Matrix about the Identity Matrix by angle degrees on the y-axis

      mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);

      gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix); // Update world matrix

      gl.clearColor(0.3,0.3,0.3,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(loop);
  };

  // Whatever function is on the inside, I want to call that function whenever
  // the screen is ready to draw.

  // Will not call function if tab loses focus
  requestAnimationFrame(loop);

};

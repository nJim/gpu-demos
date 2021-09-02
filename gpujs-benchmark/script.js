// Get the .click-me element
var button = document.querySelector('#bench');

// This will run when the .click-me element is clicked
button.addEventListener('click', function (event) {
  let size = document.getElementById("size").value || 128;

  size = parseInt(size);

  const gpu = new GPU({ mode: "gpu" });
  const cpu = new GPU({ mode: "cpu" });

  const matMultFunc = `function (a, b){
    var sum = 0;
    for (var i = 0; i < ${size}; i++){
      sum += a[this.thread.y][i] * b[i][this.thread.x];
    }
    return sum;
  }`;

  /**
   * Multiplies two matrices
   */
  const cpuMatMult = (arr1, arr2) => {
    let out = [];
    for (var i = 0; i < size; i++) {
      out.push([]);
      for (var j = 0; j < size; j++) {
        let sum = 0;
        for (var k = 0; k < size; k++) {
          sum += arr1[i][k] * arr2[k][j];
        }
        out[i][j] = sum;
      }
    }
    return out;
  };

  /**
   * Generates two matrices
   */
  function generateMatrices() {
    let arr = [],
      arx = [];
    for (var i = 0; i < size; i++) {
      arr.push([]);
      arx.push([]);
      for (var j = 0; j < size; j++) {
        arr[i][j] = Math.random();
        arx[i][j] = Math.random();
      }
    }
    console.log([arr, arx]);
    return [arr, arx];
  }

  const funcs = {
    gpuTexMatMult: gpu.createKernel(matMultFunc, {
      output: [size, size],
      outputToTexture: true
    }),
    gpuMatMult: gpu.createKernel(matMultFunc, {
      output: [size, size],
      outputToTexture: false
    }),
    gpujsCpuMatMult: cpu.createKernel(matMultFunc, { output: [size, size] }),
    cpuMatMult
  };

  function benchIt(func) {
    let time = -1 * performance.now();
    const ret = func();
    time += performance.now();
    time = Math.floor(time);
    return { time, ret };
  }

  let benchmarks = {};

  const mat = benchIt(generateMatrices);
  matGen = mat.time;
  const matrices = mat.ret;

  benchmarks.gpuTexCompilePerf = benchIt(function() {
    funcs.gpuTexMatMult.build(matrices[0], matrices[1]);
  }).time;

  benchmarks.gpuCompilePerf = benchIt(function() {
    funcs.gpuMatMult.build(matrices[0], matrices[1]);
  }).time;

  benchmarks.cpuCompilePerf = benchIt(function() {
    console.log('cpu', funcs.gpujsCpuMatMult.build(matrices[0], matrices[1]));
  }).time;

  benchmarks.gpuPerform = benchIt(function() {
    console.log('gpu', funcs.gpuMatMult(matrices[0], matrices[1]));
  }).time;

  benchmarks.cpuPerform = benchIt(function() {
    funcs.cpuMatMult(matrices[0], matrices[1]);
  }).time;

  benchmarks.gpujsCpuPerform = benchIt(function() {
    funcs.gpujsCpuMatMult(matrices[0], matrices[1]);
  }).time;

  benchmarks.gpuTexPerform = benchIt(function() {
    funcs.gpuTexMatMult(matrices[0], matrices[1]);
  }).time;

  document.getElementById('results').innerHTML = `
    <p><b>Matrix Gen Time</b>: ${matGen}ms</p>
    <table class="pure-table">
      <thead>
        <tr>
          <th>Benchmark</th>
          <th>Time Taken</th>
          <th>Compile Time</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CPU</td>
          <td>${benchmarks.cpuPerform}ms</td>
          <td>N/A</td>
          <td>${benchmarks.cpuPerform}ms</td>
        </tr>
        <tr>
          <td>CPU(GPUjs)</td>
          <td>${benchmarks.gpujsCpuPerform}ms</td>
          <td>${benchmarks.cpuCompilePerf}ms</td>
          <td>${benchmarks.cpuCompilePerf + benchmarks.gpujsCpuPerform}ms</td>
        </tr>
        <tr>
          <td>GPU</td>
          <td>${benchmarks.gpuPerform}ms</td>
          <td>${benchmarks.gpuCompilePerf}ms</td>
          <td>${benchmarks.gpuCompilePerf + benchmarks.gpuPerform}ms</td>
        </tr>
        <tr>
          <td>GPU(Texture Mode)</td>
          <td>${benchmarks.gpuTexPerform}ms</td>
          <td>${benchmarks.gpuTexCompilePerf}ms</td>
          <td>${benchmarks.gpuTexCompilePerf + benchmarks.gpuTexPerform}ms</td>
        </tr>
      </tbody>
    </table>
  `;
});

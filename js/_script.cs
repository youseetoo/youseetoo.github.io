// Replace or integrate your existing serial code and sendCMD function:
importSerialPort();
let port;
let writer;
let decoder;
let encoder;
let keepReading = false;
let readLoop;
let isConnected = false;

const outDiv = document.getElementById("term_window");
const inDiv = document.getElementById("term_input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clear");
const opencloseBtn = document.getElementById("openclose_port");
const baudSelect = document.getElementById("baud_rate");
const changeBtn = document.getElementById("change");
const portInfoSpan = document.getElementById("port_info");

function sendCMD(cmd) {
  if (isConnected && writer) {
    writer.write(encoder.encode(cmd + "\n"));
  }
}

// Implement your existing logic or integrate it similarly:
opencloseBtn.addEventListener("click", async () => {
  if (!isConnected) {
    try {
      // Web Serial
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: +baudSelect.value });
      encoder = new TextEncoder();
      decoder = new TextDecoder();
      writer = port.writable.getWriter();
      isConnected = true;
      keepReading = true;
      portInfoSpan.textContent = "Connected";
      opencloseBtn.textContent = "Disconnect";
      changeBtn.disabled = false;
      sendBtn.disabled = false;
      clearBtn.disabled = false;
      readLoop = readFromPort();
    } catch (err) {
      console.error("Failed to open serial port:", err);
    }
  } else {
    keepReading = false;
    isConnected = false;
    changeBtn.disabled = true;
    sendBtn.disabled = true;
    clearBtn.disabled = true;
    opencloseBtn.textContent = "Connect to ESP32";
    portInfoSpan.textContent = "Disconnected";
    if (reader) await reader.cancel();
    if (port && port.close) await port.close();
    port = null;
    writer = null;
  }
});

async function readFromPort() {
  while (port.readable && keepReading) {
    try {
      const readerTemp = port.readable.getReader();
      reader = readerTemp;
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          outDiv.value += decoder.decode(value);
          outDiv.scrollTop = outDiv.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error reading data:", err);
      break;
    }
  }
}

changeBtn.addEventListener("click", async () => {
  if (isConnected && port) {
    await port.close();
    await port.open({ baudRate: +baudSelect.value });
  }
});

sendBtn.addEventListener("click", () => {
  let text = inDiv.value;
  if (text.trim().length) {
    sendCMD(text);
    inDiv.value = "";
  }
});

clearBtn.addEventListener("click", () => {
  outDiv.value = "";
});

// Timelapse code:
let timelapseIntervalID;
let snapCounter = 0;
let timelapseImages = [];
let downloadImagesInterval;

document.getElementById('startTimelapseBtn').addEventListener('click', startTimelapse);
document.getElementById('stopTimelapseBtn').addEventListener('click', stopTimelapse);

function startTimelapse() {
  let interval = parseInt(document.getElementById('timelapseInterval').value);
  downloadImagesInterval = parseInt(document.getElementById('downloadImagesInterval').value);
  if (isNaN(interval) || interval <= 0) {
    alert('Please enter a valid interval in milliseconds.');
    return;
  }
  timelapseIntervalID = setInterval(captureAndBufferImage, interval);
  document.getElementById('startTimelapseBtn').disabled = true;
  document.getElementById('stopTimelapseBtn').disabled = false;
}

function stopTimelapse() {
  clearInterval(timelapseIntervalID);
  document.getElementById('startTimelapseBtn').disabled = false;
  document.getElementById('stopTimelapseBtn').disabled = true;
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

async function captureAndBufferImage() {
  let video = document.getElementById('video');
  let canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  ledOn();
  await sleep(100);

  canvas.getContext('2d').drawImage(video, 0, 0);
  timelapseImages.push(canvas.toDataURL("image/jpeg"));
  snapCounter++;
  ledOff();

  if (snapCounter >= downloadImagesInterval) {
    downloadImagesAsZip();
    timelapseImages = [];
    snapCounter = 0;
  }
  document.getElementById('snapCounter').innerText = snapCounter;
}

function downloadImagesAsZip() {
  const zip = new JSZip();
  for (let i = 0; i < timelapseImages.length; i++) {
    let imgData = timelapseImages[i].split(',')[1];
    zip.file('timelapse-snap-' + (i + 1) + '.jpg', imgData, {base64: true});
  }
  zip.generateAsync({type:"blob"}).then(content => {
    saveAs(content, "timelapse.zip");
  });
}

// Example hardware control functions:
function getState() {
  let cmd = '{"task":"/state_get"}';
  sendCMD(cmd);
}

// Laser
function setLaser0(index, value) {
  document.getElementById("laser0Value").innerText = value;
  let cmd = '{"task": "/laser_act", "LASERid":0, "LASERval": ' + value + '}';
  sendCMD(cmd);
}

document.getElementById("laser0Slider").addEventListener("input", function() {
  setLaser0(1, this.value);
});

function laser0On() {
  sendCMD('{"task": "/laser_act", "LASERid":0, "LASERval": 1024}');
}
function laser0Off() {
  sendCMD('{"task": "/laser_act", "LASERid":0, "LASERval": 0}');
}

function setLaser1(index, value) {
  document.getElementById("laser1Value").innerText = value;
  let cmd = '{"task": "/laser_act", "LASERid":1, "LASERval": ' + value + '}';
  sendCMD(cmd);
}
document.getElementById("laser1Slider").addEventListener("input", function() {
  setLaser1(1, this.value);
});

function laser1On() {
  sendCMD('{"task": "/laser_act", "LASERid":1, "LASERval": 1024}');
}
function laser1Off() {
  sendCMD('{"task": "/laser_act", "LASERid":1, "LASERval": 0}');
}

function setLaser2(index, value) {
  document.getElementById("laser2Value").innerText = value;
  let cmd = '{"task": "/laser_act", "LASERid":2, "LASERval": ' + value + '}';
  sendCMD(cmd);
}
document.getElementById("laser2Slider").addEventListener("input", function() {
  setLaser2(2, this.value);
});

function laser2On() {
  sendCMD('{"task": "/laser_act", "LASERid":2, "LASERval": 1024}');
}
function laser2Off() {
  sendCMD('{"task": "/laser_act", "LASERid":2, "LASERval": 0}');
}

function setLaser3(index, value) {
  document.getElementById("laser3Value").innerText = value;
  let cmd = '{"task": "/laser_act", "LASERid":3, "LASERval": ' + value + '}';
  sendCMD(cmd);
}
document.getElementById("laser3Slider").addEventListener("input", function() {
  setLaser3(3, this.value);
});

function laser3On() {
  sendCMD('{"task": "/laser_act", "LASERid":3, "LASERval": 1024}');
}
function laser3Off() {
  sendCMD('{"task": "/laser_act", "LASERid":3, "LASERval": 0}');
}

// LED
function ledOn() {
  let cmd = '{"task":"/ledarr_act", "led":{"LEDArrMode":1, "led_array":[{"id":0, "r":255, "g":255, "b":255}]}}';
  sendCMD(cmd);
}
function ledOff() {
  let cmd = '{"task":"/ledarr_act", "led":{"LEDArrMode":1, "led_array":[{"id":0, "r":0, "g":0, "b":0}]}}';
  sendCMD(cmd);
}

// Motor
function axisXplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisXminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisXForverplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}');
}
function axisXForverminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}');
}
function stopX() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isstop":1}]}}');
}

function axisYplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisYminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisYForverplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}');
}
function axisYForverminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}');
}
function stopY() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isstop":1}]}}');
}

function axisZplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":100,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisZminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":-100,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisZplusfine() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":4,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisZminusfine() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":-4,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function stopZ() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"isstop":1}]}}');
}

function axisAplus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function axisAminus() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}');
}
function stopA() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"isstop":1}]}}');
}

// Rotator
function rotatorXplus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":1,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorXminus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":1,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorYplus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":2,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorYminus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":2,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorZplus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":3,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorZminus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":3,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorAplus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":0,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}
function rotatorAminus() {
  sendCMD('{"task":"/rotator_act","motor":{"steppers":[{"stepperid":0,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}');
}

// Rings
function createJSON(startID, endID, state) {
  const ledArray = [];
  for (let i = startID; i <= endID; i++) {
    ledArray.push({ id: i, r: state, g: state, b: state });
  }
  return JSON.stringify({
    task: "/ledarr_act",
    led: { LEDArrMode: 8, led_array: ledArray }
  });
}

function turnOnOuterRing() {
  let cmd = createJSON(9, 24, 255);
  sendCMD(cmd);
}
function turnOffOuterRing() {
  let cmd = createJSON(9, 24, 0);
  sendCMD(cmd);
}
function turnOnMiddleRing() {
  let cmd = createJSON(1, 8, 255);
  sendCMD(cmd);
}
function turnOffMiddleRing() {
  let cmd = createJSON(1, 8, 0);
  sendCMD(cmd);
}
function turnOnCenterRing() {
  let cmd = createJSON(0, 0, 255);
  sendCMD(cmd);
}
function turnOffCenterRing() {
  let cmd = createJSON(0, 0, 0);
  sendCMD(cmd);
}

// Motor enable
function autoEnableOn() {
  let cmd = '{"task":"/motor_act", "isen":1, "isenauto":1}';
  sendCMD(cmd);
}
function autoEnableOff() {
  let cmd = '{"task":"/motor_act", "isen":1, "isenauto":0}';
  sendCMD(cmd);
}

// Bluetooth
function btPairing() {
  sendCMD('{"task":"/bt_scan"}');
}

// Example placeholder for any feature needed
function importSerialPort() {
  if (!("serial" in navigator)) {
    alert("Web Serial API not supported in this browser.");
  }
}

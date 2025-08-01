// sendCMD is defined in script.js, so we rely on it for actually sending.
function getState() {
  const cmd = '{"task":"/state_get"}';
  sendCMD(cmd);
}

function laser0On() {
  const cmd = '{"task": "/laser_act", "LASERid":0, "LASERval": 1024}';
  sendCMD(cmd);
}
function laser0Off() {
  const cmd = '{"task": "/laser_act", "LASERid":0, "LASERval": 0}';
  sendCMD(cmd);
}
// Repeat the on/off for lasers 1..3 similarly:
function laser1On() {
  sendCMD('{"task": "/laser_act", "LASERid":1, "LASERval": 1024}');
}
function laser1Off() {
  sendCMD('{"task": "/laser_act", "LASERid":1, "LASERval": 0}');
}
function laser2On() {
  sendCMD('{"task": "/laser_act", "LASERid":2, "LASERval": 1024}');
}
function laser2Off() {
  sendCMD('{"task": "/laser_act", "LASERid":2, "LASERval": 0}');
}
function laser3On() {
  sendCMD('{"task": "/laser_act", "LASERid":3, "LASERval": 1024}');
}
function laser3Off() {
  sendCMD('{"task": "/laser_act", "LASERid":3, "LASERval": 0}');
}


// Axis A
function axisAplus() {
  const stepSize = parseInt(document.getElementById("stepA").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisAminus() {
  const stepSize = parseInt(document.getElementById("stepA").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":-${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisAForverplus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisAForverminus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function stopA() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"isstop":1}]}}');
}

// Axis X
function axisXplus() {
  const stepSize = parseInt(document.getElementById("stepX").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisXminus() {
  const stepSize = parseInt(document.getElementById("stepX").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":-${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisXForverplus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisXForverminus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function stopX() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isstop":1}]}}');
}

// Axis Y
function axisYplus() {
  const stepSize = parseInt(document.getElementById("stepY").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisYminus() {
  const stepSize = parseInt(document.getElementById("stepY").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":-${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisYForverplus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisYForverminus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function stopY() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isstop":1}]}}');
}

// Axis Z
function axisZplus() {
  const stepSize = parseInt(document.getElementById("stepZ").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisZminus() {
  const stepSize = parseInt(document.getElementById("stepZ").value, 10) || 1000;
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":-${stepSize},"speed":15000,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisZForverplus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function axisZForverminus() {
  const cmd = `{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}`;
  sendCMD(cmd);
}

function stopZ() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"isstop":1}]}}');
}

// Rotators
function rotatorXplus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":1,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorXminus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":1,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorYplus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":2,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorYminus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":2,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorZplus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":3,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorZminus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":3,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorAplus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":0,"position":1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}
function rotatorAminus() {
  sendCMD(
    '{"task":"/rotator_act","motor":{"steppers":[{"stepperid":0,"position":-1000,"speed":500,"isabs":0,"isaccel":0}]}}'
  );
}

// LED rings
function createJSON(startID, endID, state) {
  const ledArray = [];
  for (let i = startID; i <= endID; i++) {
    ledArray.push({
      action: "single", // Specify the action as "single" for individual LEDs
      ledIndex: i,      // Use ledIndex to specify the LED ID
      r: state,         // Set the red value
      g: state,         // Set the green value
      b: state,         // Set the blue value
    });
  }
  return JSON.stringify({
    task: "/ledarr_act",
    qid: 17, // Add qid if required
    led: ledArray, // Use the updated array format
  });
}

function turnOnOuterRing() {
  /*
  const cmd = createJSON(9, 24, 255);
  sendCMD(cmd);
  */
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "rings", "radius": 4, "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "rings", "radius": 5, "r": 255, "g": 255, "b": 255 } }');
}
function turnOnMiddleRing() {
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "rings", "radius": 3, "r": 255, "g": 255, "b": 255 } }');
  /*
  const cmd = createJSON(1, 8, 255);
  sendCMD(cmd);
  */
}
function turnOnCenterRing() {
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "rings", "radius": 2, "r": 255, "g": 255, "b": 255 } }');
  /*const cmd = createJSON(0, 0, 255);
  sendCMD(cmd);
*/
}

function turnOnDown() {
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "down", "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "bottom", "r": 255, "g": 255, "b": 255 } }');
}
function turnOnUp() {
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "up", "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "top", "r": 255, "g": 255, "b": 255 } }');
}
function turnOnLeft() {
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "left", "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "left", "r": 255, "g": 255, "b": 255 } }');
}
function turnOnRight() {
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "right", "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "halves", "region": "right", "r": 255, "g": 255, "b": 255 } }');
}


// Motor enable
function autoEnableOn() {
  sendCMD('{"task":"/motor_act","isen":1,"isenauto":1}');
}
function autoEnableOff() {
  sendCMD('{"task":"/motor_act","isen":1,"isenauto":0}');
}

// Pairing
function btPairing() {
  sendCMD('{"task":"/bt_scan"}');
}


// We store the current PWM value in a global or local structure so that
// if user toggles "On"/"Off," we can restore the same value. 
// Example: lastLightValue[0] = 512 means channel 0 is set to 512.
let lastLightValue = [0, 0, 0, 0, 0];  // for 5 channels

function setLight(channel, value) {
  // clamp to 0..1023 just in case
  const v = Math.max(0, Math.min(1023, parseInt(value)));
  lastLightValue[channel] = v;
  // Construct the JSON
  const cmd = `{"task": "/laser_act", "LASERid": ${channel}, "LASERval": ${v}}`;
  sendCMD(cmd);
}

/**  Light X ON => enables slider & sets to last known value */
function light0On() {
  // Enable the slider
  document.getElementById("light0Slider").disabled = false;
  document.getElementById("light0SliderValue").disabled = false;
  // Disable the "On" button
  document.getElementById("light0OnBtn").disabled = true;
  // Enable the "Off" button
  document.getElementById("light0OffBtn").disabled = false;

  // Immediately set to last known value
  setLight(0, lastLightValue[0]);
  // Also set the UI to that value
  document.getElementById("light0Slider").value = lastLightValue[0];
  document.getElementById("light0SliderValue").value = lastLightValue[0];
}

function light0Off() {
  // Turn off
  setLight(0, 0);

  // slider remains at the user’s position, but is disabled
  // “Off” is disabled, “On” re-enabled
  document.getElementById("light0Slider").disabled = true;
  document.getElementById("light0SliderValue").disabled = true;
  document.getElementById("light0OnBtn").disabled = false;
  document.getElementById("light0OffBtn").disabled = true;
}

/** On slider changes, we set the value in real time */
document.getElementById("light0Slider").addEventListener("input", function () {
  // keep the text box in sync
  document.getElementById("light0SliderValue").value = this.value;
  setLight(0, this.value);
});
document.getElementById("light0SliderValue").addEventListener("change", function() {
  // if user typed a number in the box
  document.getElementById("light0Slider").value = this.value;
  setLight(0, this.value);
});

// Repeat the same pattern for Light 1, 2, 3...
// Light 1:

function light1On() {
  document.getElementById("light1Slider").disabled = false;
  document.getElementById("light1SliderValue").disabled = false;
  document.getElementById("light1OnBtn").disabled = true;
  document.getElementById("light1OffBtn").disabled = false;

  setLight(1, lastLightValue[1]);
  document.getElementById("light1Slider").value = lastLightValue[1];
  document.getElementById("light1SliderValue").value = lastLightValue[1];
}

function light1Off() {
  setLight(1, 0);

  document.getElementById("light1Slider").disabled = true;
  document.getElementById("light1SliderValue").disabled = true;
  document.getElementById("light1OnBtn").disabled = false;
  document.getElementById("light1OffBtn").disabled = true;
}

document.getElementById("light1Slider").addEventListener("input", function () {
  document.getElementById("light1SliderValue").value = this.value;
  setLight(1, this.value);
});
document.getElementById("light1SliderValue").addEventListener("change", function() {
  document.getElementById("light1Slider").value = this.value;
  setLight(1, this.value);
});

// Light 2
function light2On() {
  document.getElementById("light2Slider").disabled = false;
  document.getElementById("light2SliderValue").disabled = false;
  document.getElementById("light2OnBtn").disabled = true;
  document.getElementById("light2OffBtn").disabled = false;

  setLight(2, lastLightValue[2]);
  document.getElementById("light2Slider").value = lastLightValue[2];
  document.getElementById("light2SliderValue").value = lastLightValue[2];
}

function light2Off() {
  setLight(2, 0);

  document.getElementById("light2Slider").disabled = true;
  document.getElementById("light2SliderValue").disabled = true;
  document.getElementById("light2OnBtn").disabled = false;
  document.getElementById("light2OffBtn").disabled = true;
}

document.getElementById("light2Slider").addEventListener("input", function () {
  document.getElementById("light2SliderValue").value = this.value;
  setLight(2, this.value);
});
document.getElementById("light2SliderValue").addEventListener("change", function() {
  document.getElementById("light2Slider").value = this.value;
  setLight(2, this.value);
});

// Light 3
function light3On() {
  document.getElementById("light3Slider").disabled = false;
  document.getElementById("light3SliderValue").disabled = false;
  document.getElementById("light3OnBtn").disabled = true;
  document.getElementById("light3OffBtn").disabled = false;

  setLight(3, lastLightValue[3]);
  document.getElementById("light3Slider").value = lastLightValue[3];
  document.getElementById("light3SliderValue").value = lastLightValue[3];
}

function light3Off() {
  setLight(3, 0);

  document.getElementById("light3Slider").disabled = true;
  document.getElementById("light3SliderValue").disabled = true;
  document.getElementById("light3OnBtn").disabled = false;
  document.getElementById("light3OffBtn").disabled = true;
}

document.getElementById("light3Slider").addEventListener("input", function () {
  document.getElementById("light3SliderValue").value = this.value;
  setLight(3, this.value);
});
document.getElementById("light3SliderValue").addEventListener("change", function() {
  document.getElementById("light3Slider").value = this.value;
  setLight(3, this.value);
});

// light 4
function light4On() {
  document.getElementById("light4Slider").disabled = false;
  document.getElementById("light4SliderValue").disabled = false;
  document.getElementById("light4OnBtn").disabled = true;
  document.getElementById("light4OffBtn").disabled = false;
  // Enable the slider and value input
  // Enable the buttons for light4
  document.getElementById("light4Slider").disabled = false;
  document.getElementById("light4SliderValue").disabled = false;
  document.getElementById("light4OnBtn").disabled = true;
  document.getElementById("light4OffBtn").disabled = false;
  setLight(4, lastLightValue[4]);
  document.getElementById("light4Slider").value = lastLightValue[4];    
  document.getElementById("light4SliderValue").value = lastLightValue[4];
} 

function light4Off() {
  setLight(4, 0); 
  document.getElementById("light4Slider").disabled = true;
  document.getElementById("light4SliderValue").disabled = true;
  document.getElementById("light4OnBtn").disabled = false;
  document.getElementById("light4OffBtn").disabled = true;
  // Disable the slider and value input
  // Disable the buttons for light4
  document.getElementById("light4Slider").disabled = true;
  document.getElementById("light4SliderValue").disabled = true;
  document.getElementById("light4OnBtn").disabled = false;
  document.getElementById("light4OffBtn").disabled = true;
} 

document.getElementById("light4Slider").addEventListener("input", function () {
  document.getElementById("light4SliderValue").value = this.value;    
  setLight(4, this.value);
});
document.getElementById("light4SliderValue").addEventListener("change", function() {
  document.getElementById("light4Slider").value = this.value;
  setLight(4, this.value);
});


function createLEDMatrix() {
  const matrixContainer = document.getElementById("led-matrix");
  for (let i = 0; i < 64; i++) {
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-secondary";
    btn.textContent = i;
    btn.dataset.index = i;
    btn.onclick = async function () {
      const index = parseInt(this.dataset.index);
      const isActive = this.classList.contains("btn-success");
      const newColor = isActive ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };

      const cmd = {
        task: "/ledarr_act",
        led: {
          action: "single",
          ledIndex: index,
          ...newColor,
        },
      };

      await sendCMD(JSON.stringify(cmd));
      this.classList.toggle("btn-outline-secondary", isActive);
      this.classList.toggle("btn-success", !isActive);
    };
    matrixContainer.appendChild(btn);
  }
}


/* =====================
   Other existing motor, LED ring, etc. methods 
   remain the same, just rename or keep them as you prefer
===================== */

// LED
function ledOn() {
  // { "task": "/ledarr_act", "qid": 17, "led": { "action": "fill", "r": 255, "g": 255, "b": 255 } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "fill", "r": 255, "g": 255, "b": 255 } }');
}
function ledOff() {
  //  { "task": "/ledarr_act", "qid": 17, "led": { "action": "off" } }
  sendCMD('{ "task": "/ledarr_act", "qid": 17, "led": { "action": "off" } }');
}

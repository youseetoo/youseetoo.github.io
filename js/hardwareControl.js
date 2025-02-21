// sendCMD is defined in script.js, so we rely on it for actually sending.

function setLaser0(index, value) {
  document.getElementById("laser0Value").innerText = value;
  const cmd = `{"task": "/laser_act", "LASERid":0, "LASERval": ${value}}`;
  sendCMD(cmd);
}
document.getElementById("laser0Slider").addEventListener("input", function () {
  setLaser0(0, this.value);
});

function setLaser1(index, value) {
  document.getElementById("laser1Value").innerText = value;
  const cmd = `{"task": "/laser_act", "LASERid":1, "LASERval": ${value}}`;
  sendCMD(cmd);
}
document.getElementById("laser1Slider").addEventListener("input", function () {
  setLaser1(1, this.value);
});

function setLaser2(index, value) {
  document.getElementById("laser2Value").innerText = value;
  const cmd = `{"task": "/laser_act", "LASERid":2, "LASERval": ${value}}`;
  sendCMD(cmd);
}
document.getElementById("laser2Slider").addEventListener("input", function () {
  setLaser2(2, this.value);
});

function setLaser3(index, value) {
  document.getElementById("laser3Value").innerText = value;
  const cmd = `{"task": "/laser_act", "LASERid":3, "LASERval": ${value}}`;
  sendCMD(cmd);
}
document.getElementById("laser3Slider").addEventListener("input", function () {
  setLaser3(3, this.value);
});

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

// LED
function ledOn() {
  sendCMD(
    '{"task":"/ledarr_act","led":{"LEDArrMode":1,"led_array":[{"id":0,"r":255,"g":255,"b":255}]}}'
  );
}
function ledOff() {
  sendCMD(
    '{"task":"/ledarr_act","led":{"LEDArrMode":1,"led_array":[{"id":0,"r":0,"g":0,"b":0}]}}'
  );
}

// Motor X
function axisXplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisXminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisXForverplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}'
  );
}
function axisXForverminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}'
  );
}
function stopX() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":1,"isstop":1}]}}');
}

// Motor Y
function axisYplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisYminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisYForverplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":1500,"isabs":0,"isaccel":0}]}}'
  );
}
function axisYForverminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isforever":1,"speed":-1500,"isabs":0,"isaccel":0}]}}'
  );
}
function stopY() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":2,"isstop":1}]}}');
}

// Motor Z
function axisZplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":100,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisZminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":-100,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisZplusfine() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":4,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisZminusfine() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"position":-4,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function stopZ() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":3,"isstop":1}]}}');
}

// Motor A
function axisAplus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function axisAminus() {
  sendCMD(
    '{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"position":-1000,"speed":15000,"isabs":0,"isaccel":0}]}}'
  );
}
function stopA() {
  sendCMD('{"task":"/motor_act","motor":{"steppers":[{"stepperid":0,"isstop":1}]}}');
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
      id: i,
      r: state,
      g: state,
      b: state,
    });
  }
  return JSON.stringify({
    task: "/ledarr_act",
    led: {
      LEDArrMode: 8,
      led_array: ledArray,
    },
  });
}

function turnOnOuterRing() {
  const cmd = createJSON(9, 24, 255);
  sendCMD(cmd);
}
function turnOffOuterRing() {
  const cmd = createJSON(9, 24, 0);
  sendCMD(cmd);
}
function turnOnMiddleRing() {
  const cmd = createJSON(1, 8, 255);
  sendCMD(cmd);
}
function turnOffMiddleRing() {
  const cmd = createJSON(1, 8, 0);
  sendCMD(cmd);
}
function turnOnCenterRing() {
  const cmd = createJSON(0, 0, 255);
  sendCMD(cmd);
}
function turnOffCenterRing() {
  const cmd = createJSON(0, 0, 0);
  sendCMD(cmd);
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


// advancedControls.js

/**
 * Reads TMC parameters from inputs and sends a command, for example:
 * {"task":"/tmc_act", "msteps":16, "rms_current":700, "sgthrs":15, ... }
 */
function updateTMC() {
  const msteps = parseInt(document.getElementById("tmc_msteps").value, 10) || 16;
  const rms = parseInt(document.getElementById("tmc_rms").value, 10) || 700;
  const sgthrs = parseInt(document.getElementById("tmc_sgthrs").value, 10) || 15;
  const semin = parseInt(document.getElementById("tmc_semin").value, 10) || 5;
  const semax = parseInt(document.getElementById("tmc_semax").value, 10) || 2;
  const blank = parseInt(document.getElementById("tmc_blank").value, 10) || 24;
  const toff = parseInt(document.getElementById("tmc_toff").value, 10) || 4;
  const axis = parseInt(document.getElementById("tmc_axis").value, 10) || 2;

  const cmdObj = {
    task: "/tmc_act",
    msteps: msteps,
    rms_current: rms,
    sgthrs: sgthrs,
    semin: semin,
    semax: semax,
    blank_time: blank,
    toff: toff,
    axis: axis,
  };

  sendCMD(JSON.stringify(cmdObj));
}

/**
 * Reads the CAN address from user input, sends:
 * {"task":"/can_act", "address": 256}
 */
function updateCANAddress() {
  const address = parseInt(document.getElementById("can_address").value, 10) || 256;
  const cmdObj = {
    task: "/can_act",
    address: address,
  };
  sendCMD(JSON.stringify(cmdObj));
}

/**
 * Homing command, for example:
 * {"task":"/home_act","home":{"steppers":[{"stepperid":2,"timeout":20000,"speed":15000,"direction":-1,"endstoppolarity":0}]}}
 */
function homeStepper() {
  let stepperid = parseInt(document.getElementById("home_stepperid").value, 10);
  if (isNaN(stepperid) || stepperid < 0 || stepperid > 10) {
    stepperid = 2; // Standardwert, falls der Wert ungültig ist
  }  const timeout = parseInt(document.getElementById("home_timeout").value, 10) || 20000;
  const speed = parseInt(document.getElementById("home_speed").value, 10) || 15000;
  const direction = parseInt(document.getElementById("home_direction").value, 10) || -1;
  const endstop = parseInt(document.getElementById("home_endstop").value, 10) || 0;

  const cmdObj = {
    task: "/home_act",
    home: {
      steppers: [
        {
          stepperid: stepperid,
          timeout: timeout,
          speed: speed,
          direction: direction,
          endstoppolarity: endstop,
        },
      ],
    },
  };

  sendCMD(JSON.stringify(cmdObj));
}

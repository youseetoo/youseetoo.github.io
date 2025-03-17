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
    const stepperid = parseInt(document.getElementById("home_stepperid").value, 10) || 2;
    const timeout = parseInt(document.getElementById("home_timeout").value, 10) || 20000;
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
  
// script.js

let portOpen = false; // tracks whether a port is currently open
let portPromise; // promise used to wait until port successfully closes
let holdPort = null; // keep the last SerialPort object in memory
let port; // current SerialPort object
let reader; // current port reader object so we can call .cancel() on it

window.onload = function () {
  // Check for Web Serial API
  if ("serial" in navigator) {
    // Connect event listeners
    document
      .getElementById("openclose_port")
      .addEventListener("click", openClose);
    document.getElementById("change").addEventListener("click", changeSettings);
    document.getElementById("clear").addEventListener("click", clearTerminal);
    document.getElementById("send").addEventListener("click", sendString);
    document.getElementById("term_input").addEventListener("keydown", detectEnter);

    clearTerminal();

    // Check if there's a prefill query param: ?prefill=some_string
    const params = new URLSearchParams(window.location.search);
    let preFill = params.get("prefill");
    if (preFill) {
      document.getElementById("term_input").value = preFill;
    }
  } else {
    alert("The Web Serial API is not supported by your browser.");
  }
};

async function openClose() {
  if (portOpen) {
    // If open, close it
    reader.cancel(); // triggers read loop to end
    console.log("Attempting to close port...");
  } else {
    // If closed, open it
    portPromise = new Promise((resolve) => {
      (async () => {
        try {
          if (holdPort == null) {
            port = await navigator.serial.requestPort();
          } else {
            port = holdPort;
            holdPort = null;
          }

          const baudSelected = parseInt(document.getElementById("baud_rate").value);
          await port.open({ baudRate: baudSelected });

          const textDecoder = new TextDecoderStream();
          reader = textDecoder.readable.getReader();
          const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);

          portOpen = true;
          document.getElementById("openclose_port").innerText = "Close";
          document.getElementById("term_input").disabled = false;
          document.getElementById("send").disabled = false;
          document.getElementById("clear").disabled = false;
          document.getElementById("change").disabled = false;

          // If your environment supports .getInfo(), you can display the port info:
          const portInfo = port.getInfo();
          document.getElementById("port_info").innerText =
            "Connected (VID " +
            portInfo.usbVendorId +
            ", PID " +
            portInfo.usbProductId +
            ")";

          let imgValue = "";

          // Read loop
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              reader.releaseLock();
              break;
            }
            document.getElementById("term_window").value += value;
            // If you have a special token to parse images:
            // ...
            console.log(value);
          }

          await readableStreamClosed.catch(() => {
            /* Ignore the error */
          });

          await port.close();
          portOpen = false;
          document.getElementById("openclose_port").innerText = "Connect to ESP32";
          document.getElementById("term_input").disabled = true;
          document.getElementById("send").disabled = true;
          document.getElementById("change").disabled = true;
          document.getElementById("port_info").innerText = "Disconnected";
          console.log("Port closed");
          resolve();
        } catch (err) {
          console.error("Error opening port:", err);
        }
      })();
    });
  }
}

// Change baud rate or other settings
async function changeSettings() {
  holdPort = port; // stash the current port
  reader.cancel(); // force the read loop to break
  console.log("Changing settings, waiting for port to close...");
  await portPromise;
  console.log("Port closed, re-opening with new settings...");
  openClose();
}

function clearTerminal() {
  document.getElementById("term_window").value = "";
}

// Send text from the input area
async function sendString() {
  let outString = document.getElementById("term_input").value;
  document.getElementById("term_input").value = "";

  const textEncoder = new TextEncoderStream();
  const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
  const writer = textEncoder.writable.getWriter();

  await writer.write(outString);
  document.getElementById("term_window").value += "\n> " + outString + "\n";

  writer.close();
  await writableStreamClosed;
}

// Exported so hardwareControl can use it
async function sendCMD(outString) {
  const textEncoder = new TextEncoderStream();
  const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
  const writer = textEncoder.writable.getWriter();

  await writer.write(outString);
  document.getElementById("term_window").value += "\n> " + outString + "\n";

  writer.close();
  await writableStreamClosed;
}

// Detect Enter key in the term_input to send automatically
function detectEnter(e) {
  if (e.keyCode === 13) {
    e.preventDefault();
    sendString();
  }
}

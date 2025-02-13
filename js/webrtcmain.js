// webrtcmain.js

let videoElement = document.getElementById("video");
let audioInputSelect = document.getElementById("audioSource");
let audioOutputSelect = document.getElementById("audioOutput");
let videoSelect = document.getElementById("videoSource");

function gotDevices(deviceInfos) {
  // Handles filling up the <select> elements with available devices
  deviceInfos.forEach((deviceInfo) => {
    let option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === "audiooutput") {
      option.text = deviceInfo.label || `Speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  });
}

navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch((err) => {
    console.error("Error enumerating devices:", err);
  });

function startStream() {
  if (!videoSelect.value) return;

  const constraints = {
    audio: { deviceId: audioInputSelect.value ? { exact: audioInputSelect.value } : undefined },
    video: { deviceId: videoSelect.value ? { exact: videoSelect.value } : undefined },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      videoElement.srcObject = stream;
    })
    .catch((error) => {
      console.error("Error accessing media devices.", error);
    });
}

// On device selection change, re-start stream
audioInputSelect.onchange = startStream;
audioOutputSelect.onchange = function () {
  // Changing audio output in browsers is tricky. Some browsers don't allow it
  let sinkId = audioOutputSelect.value;
  if ("sinkId" in videoElement) {
    videoElement
      .setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch((err) => {
        console.error("Error setting audio output device:", err);
      });
  }
};
videoSelect.onchange = startStream;

// Start the initial stream
startStream();

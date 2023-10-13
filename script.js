document.addEventListener("DOMContentLoaded", function() {

  const startButton = document.getElementById("startButton");
  const soundLevelDiv = document.getElementById("soundLevel");
  const canvasDiv = document.getElementById("soundLevelChart");
  const ctx = canvasDiv.getContext("2d");

  const bufferSize = 240; 
  let circularBuffer = new Array(bufferSize).fill(null); 
  let timeBuffer = new Array(bufferSize).fill(0);
  let writeIndex = 0;

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeBuffer,
      datasets: [{
        label: 'Sound Level',
        data: circularBuffer,
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false
      }]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Elapsed Time (s)'
          }
        },
        y: { min: 0, max: 256 }
      }
    }
  });

  let startTime;

  const handleSuccess = function(stream) {
    const audioContext = new AudioContext();
    const audioInput = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    const fftSize = 1024;

    analyser.fftSize = fftSize;
    audioInput.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    startTime = new Date();

    const computeSoundLevel = function() {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for(let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const elapsedSeconds = (new Date() - startTime) / 1000;

      soundLevelDiv.innerHTML = `Sound Level: ${average.toFixed(2)}`;

      // Handle buffer wrap-around
      if (writeIndex === 0) {
        circularBuffer[bufferSize - 1] = average;
        circularBuffer[0] = null;
      } else {
        circularBuffer[writeIndex] = average;
      }

      timeBuffer[writeIndex] = elapsedSeconds.toFixed(2);
      writeIndex = (writeIndex + 1) % bufferSize;

      // Check sound level and transition background color
      if (average > 40) {
        canvasDiv.style.transition = "background-color 1s";
		// lightblue
        canvasDiv.style.backgroundColor = "indianred";
      } else {
        canvasDiv.style.backgroundColor = "white";
      }

      chart.update();
      setTimeout(computeSoundLevel, 250);
    };

    computeSoundLevel();
  };

  startButton.addEventListener("click", function() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleSuccess)
      .then(() => {
        if(audioContext.state === 'suspended') {
          audioContext.resume();
        }
      });
  });
});

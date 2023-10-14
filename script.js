document.addEventListener("DOMContentLoaded", function() {

  // Register the annotation plugin
  const ChartAnnotation = window['chartjs-plugin-annotation'];
  Chart.register(ChartAnnotation);

  const microphoneButton = document.getElementById("microphoneButton");
  const soundLevelDiv = document.getElementById("soundLevel");
  const maxSoundLevelDiv = document.getElementById("maxSoundLevel");
  const canvasDiv = document.getElementById("soundLevelChart");
  const ctx = canvasDiv.getContext("2d");
  

  const bufferSize = 240; 
  let circularBuffer = new Array(bufferSize).fill(null); 
  let timeBuffer = new Array(bufferSize).fill(0);
  let writeIndex = 0;
  let maxLevel = 20;

  const maxLevelSpinner = document.getElementById("maxLevelSpinner");
  maxLevelSpinner.value = maxLevel; // Initialize the spinner with the initial maxLevel value


  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timeBuffer,
      datasets: [{
        label: 'Sound Level',
        data: circularBuffer,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'green',  // Add this line to make the bar green
        fill: false
      }]
    },
    options: {
      plugins: {
        annotation: {
          annotations: [{
            type: 'line',
            mode: 'horizontal',
            scaleID: 'y',
            value: maxLevel,
            borderColor: 'red',
            borderWidth: 2
          }]
        }
      },
      animation: false,
      title: {
        display: true,
        text: 'My Chart'
      },
      legend: {
        display: true,
      },
      tooltips: {
        enabled: true,
        mode: 'index'
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Elapsed Time (s)'
          }
        },
        y: { min: 0, max: 60 }
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

      soundLevelDiv.innerHTML = `${average.toFixed(2)}`;
      maxSoundLevelDiv.innerHTML = `${maxLevel}`;

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
      if (average > maxLevel) {
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

  microphoneButton.addEventListener("click", function() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleSuccess)
      .then(() => {
        if(audioContext.state === 'suspended') {
          audioContext.resume();
        }
      });
  
    
    if (microphoneButton.innerHTML === 'Start Microphone') {
      microphoneButton.innerHTML = 'Stop Microphone';
      // Code to start the microphone and update the graph goes here
      // ...
    } else {
      microphoneButton.innerHTML = 'Start Microphone';
      location.reload();
    }
  });

  // Update maxLevel when the spinner value changes
  maxLevelSpinner.addEventListener('change', function() {
    maxLevel = parseInt(this.value, 10);
    chart.options.plugins.annotation.annotations[0].value = maxLevel;
    chart.options.plugins.annotation.annotations[0].borderColor = blue;
    maxSoundLevelDiv.innerHTML = `${maxLevel}`;
    chart.update();
  });  
});

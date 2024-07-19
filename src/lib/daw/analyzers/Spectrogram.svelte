<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";

  let canvas = null;
  let canvasCtx = null;
  let analyser = null;

  onMount(() => {
    analyser = audioManager.audioContext.createAnalyser();
    audioManager.mixer.connect(analyser);
    canvasCtx = canvas.getContext("2d");

    drawSpectrogram();
  });

  function drawSpectrogram() {
    analyser.fftSize = 1024;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const draw = () => {
      if (canvas === null) return;
      if (tempCanvas === null) return;

      analyser.getByteFrequencyData(dataArray);

      tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        canvasCtx.fillStyle = getColor(value);
        canvasCtx.fillRect(canvas.width - 1, canvas.height - i, 1, 1);
      }

      canvasCtx.translate(-1, 0);
      canvasCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      canvasCtx.setTransform(1, 0, 0, 1, 0, 0);

      requestAnimationFrame(draw);
    };

    draw();
  }

  function getColor(value) {
    const percent = value / 255;
    const r = Math.round(percent * 255);
    const g = Math.round(percent * 255);
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
</script>

<div class="h-10 w-28 overflow-hidden rounded border-2 border-dark-400 bg-dark-400">
  <canvas bind:this={canvas} class="h-full w-full"></canvas>
</div>

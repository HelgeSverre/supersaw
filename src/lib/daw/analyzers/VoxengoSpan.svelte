<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";

  let canvas = null;
  let canvasCtx = null;
  let analyser = null;

  onMount(() => {
    analyser = audioManager.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    audioManager.mixer.connect(analyser);
    canvasCtx = canvas.getContext("2d");

    drawSpectrum();
  });

  function drawSpectrum() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!!!canvas) {
        return;
      }
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Rainbow colors
        const percent = i / bufferLength;
        const hue = Math.round(percent * 360);
        const color = `hsl(${hue}, 100%, 50%)`;

        canvasCtx.fillStyle = color;
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };

    draw();
  }
</script>

<div class="h-10 w-60 overflow-hidden rounded border-2 border-dark-400 bg-dark-400">
  <canvas bind:this={canvas} class="h-full w-full"></canvas>
</div>

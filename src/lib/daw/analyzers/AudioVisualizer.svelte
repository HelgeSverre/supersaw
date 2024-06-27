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

    drawAnalyzer();
  });

  function drawAnalyzer() {
    if (canvasCtx === null) return;

    analyser.fftSize = 2048 * 4;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "#383843";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "#61dafb";

    canvasCtx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    requestAnimationFrame(drawAnalyzer);
  }
</script>

<div class="h-10 w-96 overflow-hidden rounded border-2 border-dark-400 bg-dark-400">
  <canvas bind:this={canvas} class="h-full w-full"></canvas>
</div>

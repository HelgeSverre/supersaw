<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";

  let canvas = null;
  let canvasCtx = null;
  let analyser = null;

  onMount(() => {
    analyser = audioManager.audioContext.createAnalyser();
    audioManager.mixer.connect(analyser);
    canvas = document.querySelector("canvas");
    canvasCtx = canvas.getContext("2d");

    drawAnalyzer();
  });

  function drawAnalyzer() {
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "#1c1f26";
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

<div class="fixed bottom-0 right-0 z-20 rounded bg-yellow-400 p-4">
  <canvas bind:this={canvas} width="500" height="200"></canvas>
</div>

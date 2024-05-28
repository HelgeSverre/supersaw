<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";

  let svg = null;
  let analyser = null;
  let width = 800;
  let height = 400;
  let path = "";

  onMount(() => {
    analyser = audioManager.audioContext.createAnalyser();
    audioManager.mixer.connect(analyser);
    drawSpectrum();
  });

  function drawSpectrum() {
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Clear the path
      let d = `M 0 ${height}`;

      for (let i = 0; i < bufferLength; i++) {
        const logIndex = Math.log10(1 + (i / bufferLength) * 9);
        const index = Math.floor(logIndex * bufferLength);
        const x = (Math.log10(1 + index) / Math.log10(1 + bufferLength)) * width;
        const y = height - (dataArray[index] / 255) * height;
        d += ` L ${x} ${y}`;
      }

      d += ` L ${width} ${height} Z`;
      path = d;
    };

    draw();
  }
</script>

<svg bind:this={svg} width={width} height={height} class="spectrum-svg">
  <path d={path} fill="url(#gradient)" />
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color: hsl(0, 100%, 50%); stop-opacity: 1" />
      <stop offset="25%" style="stop-color: hsl(90, 100%, 50%); stop-opacity: 1" />
      <stop offset="50%" style="stop-color: hsl(180, 100%, 50%); stop-opacity: 1" />
      <stop offset="75%" style="stop-color: hsl(270, 100%, 50%); stop-opacity: 1" />
      <stop offset="100%" style="stop-color: hsl(360, 100%, 50%); stop-opacity: 1" />
    </linearGradient>
  </defs>
</svg>

<style>
  .spectrum-svg {
    width: 100%;
    height: auto;
    border: 2px solid #2d3748;
    border-radius: 0.25rem;
    background-color: #2d3748;
  }
</style>

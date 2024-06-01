<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";

  let compressorSettings = {
    threshold: -50,
    knee: 40,
    ratio: 4,
    attack: 0.01,
    release: 0.25,
  };

  let analyserCompressed;
  let analyser;
  let compressor;
  let canvas;

  onMount(() => {
    setupAudio();
    drawWaveform();
  });

  $: updateCompressorSettings(); // Reactive statement to update compressor settings

  function updateCompressorSettings() {
    if (compressor) {
      compressor.threshold.value = compressorSettings.threshold;
      compressor.knee.value = compressorSettings.knee;
      compressor.ratio.value = compressorSettings.ratio;
      compressor.attack.value = compressorSettings.attack;
      compressor.release.value = compressorSettings.release;
    }
  }

  function setupAudio() {
    const audioContext = audioManager.audioContext;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048 * 8 * 2;
    audioManager.mixer.connect(analyser);

    compressor = audioContext.createDynamicsCompressor();
    compressor.connect(analyser);
    analyser.connect(audioContext.destination);
    updateCompressorSettings();

    analyserCompressed = audioContext.createAnalyser();
    analyserCompressed.fftSize = 2048 * 8 * 2;
    compressor.connect(analyserCompressed);
    audioManager.mixer.connect(analyserCompressed);

    updateCompressorSettings();
  }

  function drawWaveform() {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    // Clear
    ctx.fillStyle = "#383843";
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#61dafb";

    ctx.beginPath();

    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    // Draw middle line
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    /// ================================================

    // Draw raw
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fbf361";
    // Draw compressed
    const bufferLengthCompressed = analyserCompressed.fftSize;
    const dataCompressed = new Uint8Array(bufferLengthCompressed);
    analyserCompressed.getByteTimeDomainData(dataCompressed);

    ctx.beginPath();
    let compressedSliceWidth = (width * 1.0) / bufferLengthCompressed;
    let compressedX = 0;
    for (let i = 0; i < bufferLengthCompressed; i++) {
      let v = dataCompressed[i] / 128.0;
      const y = (v * height) / 2;
      if (i === 0) {
        ctx.moveTo(compressedX, y);
      } else {
        ctx.lineTo(compressedX, y);
      }
      compressedX += compressedSliceWidth;
    }
    ctx.stroke();

    /// ================================================
    /// Draw stuff

    // Draw threshold line
    const thresholdY = (height / 2) * (1 + compressorSettings.threshold / 100);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();

    requestAnimationFrame(drawWaveform);
  }
</script>

<div class="flex h-64 w-96 flex-col gap-1 rounded border border-dark-100 bg-dark-700 p-2">
  <canvas bind:this={canvas} class=" h-full w-full rounded-sm border border-dark-100"></canvas>

  <div class="flex flex-row gap-1">
    {#each Object.keys(compressorSettings) as setting}
      <div class="flex flex-col gap-1">
        <span class="text-xs text-white/50">{setting}</span>
        <input
          class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-dark-100"
          type="number"
          min={setting === "threshold" ? "-100" : "0"}
          max={setting === "threshold" ? "0" : setting === "ratio" ? "20" : "100"}
          name={setting}
          bind:value={compressorSettings[setting]}
        />
      </div>
    {/each}
  </div>
</div>

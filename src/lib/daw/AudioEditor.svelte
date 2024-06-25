<script>
  import { onMount } from "svelte";
  import { AudioProcessor } from "../../core/audio-processor.js";
  import { audioManager } from "../../core/audio.js";
  import { Spinner, Waveform } from "phosphor-svelte";
  import TextButton from "../ui/TextButton.svelte";
  import SegmentGroup from "../ui/SegmentGroup.svelte";
  import { WaveformSimilarityOverlapAdd } from "../../core/time-stretching/WaveformSimilarityOverlapAdd";

  let processing = false;
  let originalBuffer;
  let processedBuffer;
  let context;
  let audioProcessor;

  let method = "wsola";
  let windowType = "hann";

  // Granular synthesis
  let windowSize = 256;
  let overlap = 0.5;
  let stretchFactor = 0.5;

  // Phase vocoder
  let hopSize = 64;

  let canvasOriginal;
  let originalDuration;

  let canvasProcessed;
  let processedDuration;

  let startTime;
  let duration;
  let elapsed;
  let progress = 0;
  let progressAnimationFrameId;

  onMount(() => {
    context = audioManager.audioContext;
    audioProcessor = new AudioProcessor(context);

    loadAudioUrl("/samples/freesound/hardstyle-kick-249.wav");
    // loadAudioUrl("/samples/freesound/vibes.wav");
  });

  async function loadAudioUrl(url) {
    originalBuffer = await audioManager.loadAudioBuffer(url);
    processedBuffer = originalBuffer;

    originalDuration = originalBuffer.duration;
    processedDuration = processedBuffer.duration;

    drawWaveforms();
  }

  async function loadAudio(event) {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      originalBuffer = await context.decodeAudioData(arrayBuffer);
      processedBuffer = originalBuffer;

      originalDuration = originalBuffer.duration;
      processedDuration = processedBuffer.duration;

      drawWaveforms();
    }
  }

  async function processAudio() {
    processing = true;

    if (method === "granular") {
      processedBuffer = audioProcessor.granularSynthesis(originalBuffer, {
        grainSize: windowSize,
        overlap,
        stretchFactor,
        windowType,
      });
    } else if (method === "phaseVocoder") {
      processedBuffer = audioProcessor.phaseVocoder(originalBuffer, {
        windowSize: windowSize,
        hopSize: hopSize,
        stretchFactor: stretchFactor,
        windowType: windowType,
      });
    } else if (method === "spectral") {
      processedBuffer = audioProcessor.spectralProcessing(originalBuffer, {
        windowSize,
        hopSize,
        stretchFactor,
        windowType,
      });
    } else if (method === "tdhs") {
      processedBuffer = audioProcessor.timeDomainHarmonicScaling(originalBuffer, stretchFactor);
    } else if (method === "wsola") {
      const wip = new WaveformSimilarityOverlapAdd(audioManager.audioContext, stretchFactor);
      processedBuffer = wip.process(originalBuffer);
      console.log(processedBuffer);
    } else {
      alert("invalid synthesis method");
      return;
    }

    originalDuration = originalBuffer.duration;
    processedDuration = processedBuffer.duration;
    drawWaveform(processedBuffer, canvasProcessed);
    processing = false;
  }

  function playAudio(buffer) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(audioManager.mixer);
    source.start();

    startTime = context.currentTime;
    duration = buffer.duration;
    elapsed = context.currentTime - startTime;

    progressAnimationFrameId = requestAnimationFrame(updateProgress);
  }

  function updateProgress() {
    elapsed = context.currentTime - startTime;
    progress = Math.min(elapsed / duration, 1);

    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(progressAnimationFrameId);
      setTimeout(() => {
        progress = 0;
      }, 100);
    }
  }

  function drawWaveforms() {
    drawWaveform(originalBuffer, canvasOriginal);
    drawWaveform(processedBuffer, canvasProcessed);
  }

  function drawWaveform(buffer, canvas) {
    const canvasContext = canvas.getContext("2d");
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const height = (canvas.height = canvas.clientHeight * devicePixelRatio);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / devicePixelRatio / 2;

    canvasContext.scale(devicePixelRatio, devicePixelRatio);
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = "#61dafb";
    canvasContext.beginPath();
    for (let i = 0; i < width; i++) {
      const min = Math.min(...data.subarray(i * step, (i + 1) * step));
      const max = Math.max(...data.subarray(i * step, (i + 1) * step));
      canvasContext.moveTo(i, (1 + min) * amp);
      canvasContext.lineTo(i, (1 + max) * amp);
    }
    canvasContext.stroke();
  }
</script>

<div class="flex w-full max-w-4xl flex-col gap-4 rounded border border-dark-600 bg-dark-800 p-4">
  <div>
    <label for="windowSize" class="mb-1 block text-xs text-accent-yellow">Load Audio File</label>
    <input
      type="file"
      id="audioFile"
      accept="audio/*"
      on:change={loadAudio}
      class="w-full cursor-pointer rounded text-light-soft file:mr-4 file:rounded file:border-0 file:bg-dark-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-light hover:file:cursor-pointer hover:file:bg-dark-200"
    />
  </div>

  <SegmentGroup additionalClasses="items-end">
    <div>
      <label for="stretchFactor" class="mb-1 block text-xs text-accent-yellow">Stretch Factor</label>
      <input
        type="number"
        id="stretchFactor"
        bind:value={stretchFactor}
        step="0.1"
        min="0.1"
        class="h-10 w-28 rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
      />
    </div>
    <div>
      <label for="windowSize" class="mb-1 block text-xs text-accent-yellow">Window/Grain Size</label>

      <select
        id="windowSize"
        bind:value={windowSize}
        class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
      >
        {#each [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192] as size}
          <option value={size}>{size}</option>
        {/each}
      </select>
    </div>

    {#if method === "granular"}
      <div>
        <label for="overlap" class="mb-1 block text-xs text-accent-yellow">Overlap</label>
        <input
          type="number"
          id="overlap"
          bind:value={overlap}
          step="0.1"
          min="0"
          max="1"
          class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
        />
      </div>
    {/if}

    {#if method === "wsola" || method === "phaseVocoder" || method === "spectral"}
      <div>
        <label for="hopSize" class="mb-1 block text-xs text-accent-yellow">Hop Size </label>
        <select
          id="hopSize"
          bind:value={hopSize}
          class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
        >
          {#each [4, 8, 16, 32, 64, 128, 256, 512, 1024] as size}
            <option value={size}>{size}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="windowType" class="mb-1 block text-xs text-accent-yellow">Window Func</label>
        <select
          id="windowType"
          bind:value={windowType}
          class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
        >
          <option value="hann">Hann Window</option>
          <option value="hamming">Hamming Window</option>
          <option value="blackman">Blackman Window</option>
        </select>
      </div>
    {/if}
    <div>
      <label for="method" class="mb-1 block text-xs text-accent-yellow">Synthesis Method</label>
      <select
        id="method"
        bind:value={method}
        class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
      >
        <option value="granular">Granular</option>
        <option value="phaseVocoder">Phase Vocoder</option>
        <option value="spectral">Spectral</option>
        <option value="tdhs">Time-Domain Harmonic Scaling</option>
        <option value="wsola">Waveform Similarity Overlap-Add</option>
      </select>
    </div>
  </SegmentGroup>

  <SegmentGroup>
    <TextButton on:click={processAudio}>
      <Waveform size="24" class="-mx-1 text-accent-yellow" />
    </TextButton>

    <TextButton on:click={() => playAudio(originalBuffer)}>Original</TextButton>
    <TextButton on:click={() => playAudio(processedBuffer)}>Processed</TextButton>
  </SegmentGroup>

  <div class="flex flex-col gap-1">
    <div class="relative rounded border border-dark-300 bg-gray-950 px-4">
      {#if originalDuration}
        <span class="absolute right-2 top-2 text-xs text-light/50">{originalDuration?.toFixed(3)}s</span>
      {/if}
      <canvas height="1000" width="1000" bind:this={canvasOriginal} class="h-32 w-[750px]" id="waveform-original"
      ></canvas>
      <div class="absolute inset-0 bottom-0 flex w-full items-center justify-start">
        <div
          class="absolute h-full border-r border-accent-neon bg-accent-neon/5"
          style="width: {progress * 100}%;"
        ></div>
      </div>
    </div>

    <div class="relative rounded border border-dark-300 bg-gray-950 px-4">
      {#if processedDuration}
        <span class="absolute right-2 top-2 text-xs text-light/50">{processedDuration?.toFixed(3)}s</span>
      {/if}
      <canvas height="1000" width="1000" bind:this={canvasProcessed} class="h-32 w-[750px]" id="waveform-processed"
      ></canvas>
      <div class="absolute inset-0 bottom-0 flex w-full items-center justify-start">
        <div
          class="absolute h-full border-r border-accent-neon bg-accent-neon/5"
          style="width: {progress * 100}%;"
        ></div>
      </div>

      {#if processing}
        <div class="absolute inset-0 flex items-center justify-center bg-gray-500/80">
          <Spinner size="42" class="animate-spin text-black" />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  canvas {
    image-rendering: high-quality;
  }
</style>

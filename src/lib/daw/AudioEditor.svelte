<script>
  import { onMount } from "svelte";
  import { AudioProcessor } from "../../core/audio-processor.js";
  import { audioManager } from "../../core/audio.js";
  import { Spinner, Waveform } from "phosphor-svelte";
  import TextButton from "../ui/TextButton.svelte";
  import SegmentGroup from "../ui/SegmentGroup.svelte";
  import { WaveformSimilarityOverlapAdd } from "../../core/time-stretching/WaveformSimilarityOverlapAdd";
  import { TransientPreservingStretcher } from "../../core/time-stretching/TransientPreserving";
  import { GranularTimeStretcher } from "../../core/time-stretching/Granular";
  import { SpectralTimeStretcher } from "../../core/time-stretching/Spectral";
  import { TimeDomainHarmonicScaling } from "../../core/time-stretching/TimeDomainHarmoniScaling";
  import { PhaseVocoder } from "../../core/time-stretching/PhaseVocoder";

  let processing = false;
  let originalBuffer;
  let processedBuffer;
  let context;

  const windowSizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  const hopSizes = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
  const windowFuncs = ["hann", "hamming", "blackman"];

  // Configure the mapping
  const synthesisParams = {
    granular: [
      {
        default: 256,
        name: "grainSize",
        type: "select",
        options: windowSizes,
        label: "Grain Size",
      },
      {
        default: 0.5,
        name: "overlap",
        type: "number",
        min: 0,
        max: 1,
        step: 0.1,
        label: "Overlap",
      },
    ],
    transients: [
      {
        default: 0.1,
        name: "transientThreshold",
        type: "number",
        min: 0,
        max: 1,
        step: 0.1,
        label: "Transient Threshold",
      },
      {
        default: 256,
        name: "windowSize",
        type: "select",
        options: windowSizes,
        label: "Window Size",
      },
      {
        default: 64,
        name: "hopSize",
        type: "select",
        options: hopSizes,
        label: "Hop Size",
      },
      {
        default: "hann",
        name: "windowType",
        type: "select",
        options: windowFuncs,
        label: "Window Func",
      },
    ],
    wsola: [
      {
        default: 2,
        name: "seekWindowMs",
        type: "number",
        min: 0,
        max: 100,
        step: 0.1,
        label: "Seek Window (ms)",
      },
      {
        default: 8,
        name: "overlapMs",
        type: "number",
        min: 0,
        max: 1000,
        step: 0.1,
        label: "Overlap (ms)",
      },
    ],

    phaseVocoder: [
      {
        default: 256,
        name: "windowSize",
        type: "select",
        options: windowSizes,
        label: "Window Size",
      },
      {
        default: 64,
        name: "hopSize",
        type: "select",
        options: hopSizes,
        label: "Hop Size",
      },
      {
        default: "hann",
        name: "windowType",
        type: "select",
        options: windowFuncs,
        label: "Window Func",
      },
    ],
    spectral: [
      {
        default: 256,
        name: "windowSize",
        type: "select",
        options: windowSizes,
        label: "Window Size",
      },
      {
        default: 64,
        name: "hopSize",
        type: "select",
        options: hopSizes,
        label: "Hop Size",
      },
      {
        default: "hann",
        name: "windowType",
        type: "select",
        options: windowFuncs,
        label: "Window Func",
      },
    ],
    tdhs: [
      {
        default: 256,
        name: "windowSize",
        type: "select",
        options: windowSizes,
        label: "Window Size",
      },
      {
        default: 64,
        name: "hopSize",
        type: "select",
        options: hopSizes,
        label: "Hop Size",
      },
      {
        default: "hann",
        name: "windowType",
        type: "select",
        options: windowFuncs,
        label: "Window Func",
      },
    ],
  };
  let params = {};
  // ------------------------------------------------------

  let method = "transients";
  let stretchFactor = 0.8;
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

    loadAudioUrl("/samples/freesound/hardstyle-kick-249.wav");
    // loadAudioUrl("/samples/freesound/vibes.wav");

    switchMethod(localStorage.getItem("synthesisMethod") || "transients");
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

  function processAudio() {
    processing = true;

    console.log(`[START] Processing audio with method: ${method}`);
    const audioProcessor = new AudioProcessor(audioManager.audioContext);

    try {
      switch (method) {
        case "granular": {
          const engine = new GranularTimeStretcher(audioManager.audioContext, {
            stretchFactor: stretchFactor,
            grainSize: params.grainSize,
            overlap: params.overlap,
            windowType: params.windowType,
          });
          processedBuffer = engine.process(originalBuffer);
          break;
        }
        case "tdhs": {
          const engine = new TimeDomainHarmonicScaling(audioManager.audioContext, {
            stretchFactor: stretchFactor,
            windowSize: params.windowSize,
            hopSize: params.hopSize,
            windowType: params.windowType,
          });
          processedBuffer = engine.process(originalBuffer);
          break;
        }
        case "phaseVocoder": {
          const engine = new PhaseVocoder(audioManager.audioContext, {
            stretchFactor: 1.5,
            windowSize: 2048,
            hopSize: 512,
            windowType: "hann",
          });

          processedBuffer = engine.process(originalBuffer);

          processedBuffer = audioProcessor.phaseVocoder(originalBuffer, {
            stretchFactor: stretchFactor,
            windowSize: params.windowSize,
            hopSize: params.hopSize,
            windowType: params.windowType,
          });
          break;
        }
        case "spectral": {
          const engine = new SpectralTimeStretcher(audioManager.audioContext, {
            stretchFactor: stretchFactor,
            windowSize: params.windowSize,
            hopSize: params.hopSize,
            windowType: params.windowType,
          });
          processedBuffer = engine.process(originalBuffer);
          break;
        }
        case "wsola": {
          const engine = new WaveformSimilarityOverlapAdd(audioManager.audioContext, {
            stretchFactor: stretchFactor,
            overlapMs: params.overlapMs,
            seekWindowMs: params.seekWindowMs,
          });
          processedBuffer = engine.process(originalBuffer);
          break;
        }
        case "transients": {
          const engine = new TransientPreservingStretcher(audioManager.audioContext, {
            tempo: stretchFactor,
            threshold: params.transientThreshold,
            windowSize: params.windowSize,
            hopSize: params.hopSize,
            windowType: params.windowType,
          });
          processedBuffer = engine.process(originalBuffer);
          break;
        }

        default:
          throw new Error("Invalid synthesis method");
      }

      originalDuration = originalBuffer.duration;
      processedDuration = processedBuffer.duration;

      drawWaveforms();
    } catch (error) {
      console.error("Error processing audio:", error);
      alert(`Error processing audio: ${error.message}`);
    } finally {
      processing = false;
    }
    console.log("[END] Finished Processing audio");
  }

  let currentSource;

  function playAudio(buffer) {
    if (currentSource) {
      currentSource.stop();
      currentSource.disconnect();
      currentSource = null;
    }

    currentSource = context.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(audioManager.mixer);
    currentSource.start();

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

  function switchMethod(newMethod) {
    localStorage.setItem("synthesisMethod", newMethod);

    method = newMethod;
    params = synthesisParams[method].reduce((acc, param) => {
      acc[param.name] = param.default;
      return acc;
    }, {});
  }
</script>

<div class="flex w-full max-w-4xl flex-col gap-4 rounded border border-dark-600 bg-dark-800 p-4">
  <div>
    <label for="audioFile" class=" block text-xs text-accent-yellow">Load Audio File</label>
    <input
      type="file"
      id="audioFile"
      accept="audio/*"
      on:change={loadAudio}
      class="h-10 w-full cursor-pointer rounded text-light-soft file:mr-4 file:rounded file:border-0 file:bg-dark-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-light hover:file:cursor-pointer hover:file:bg-dark-200"
    />
  </div>
  <div>
    <pre class="rounded border border-dark-400 bg-dark-600 p-2 text-xs text-white">{JSON.stringify(
        params,
        null,
        2,
      )}</pre>
  </div>

  <SegmentGroup>
    {#if synthesisParams[method]}
      {#each synthesisParams[method] as param}
        <div>
          <label for={param.name} class="mb-1 block text-xs text-accent-yellow">{param.label}</label>
          {#if param.type === "select"}
            <select
              id={param.name}
              bind:value={params[param.name]}
              class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
            >
              {#each param.options as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          {:else if param.type === "number"}
            <input
              type="number"
              id={param.name}
              bind:value={params[param.name]}
              step={param.step}
              min={param.min}
              max={param.max}
              class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
            />
          {/if}
        </div>
      {/each}
    {/if}
  </SegmentGroup>

  <div class="flex flex-row items-end justify-between">
    <SegmentGroup>
      <TextButton on:click={processAudio}>
        <Waveform size="24" class="-mx-1 text-accent-yellow" />
      </TextButton>

      <TextButton on:click={() => playAudio(originalBuffer)}>Original</TextButton>
      <TextButton on:click={() => playAudio(processedBuffer)}>Processed</TextButton>
    </SegmentGroup>

    <SegmentGroup>
      <div>
        <label for="method" class="mb-1 block text-xs text-accent-yellow">Synthesis Method</label>
        <select
          id="method"
          bind:value={method}
          on:change={(e) => switchMethod(e.target.value)}
          class="h-10 w-full rounded bg-dark-400 px-2 text-sm font-normal placeholder-light-soft/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
        >
          <option value="granular">Granular</option>
          <option value="phaseVocoder">Phase Vocoder</option>
          <option value="spectral">Spectral</option>
          <option value="tdhs">Time-Domain Harmonic Scaling</option>
          <option value="wsola">Waveform Similarity Overlap-Add</option>
          <option value="transients">Transient Preserving</option>
        </select>
      </div>
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
    </SegmentGroup>
  </div>

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

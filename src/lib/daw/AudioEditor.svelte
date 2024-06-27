<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import { DownloadSimple, Waveform } from "phosphor-svelte";
  import TextButton from "../ui/TextButton.svelte";
  import SegmentGroup from "../ui/SegmentGroup.svelte";
  import { WaveformSimilarityOverlapAdd } from "../../core/time-stretching/WaveformSimilarityOverlapAdd";
  import { TransientPreservingStretcher } from "../../core/time-stretching/TransientPreserving";
  import { GranularTimeStretcher } from "../../core/time-stretching/Granular";
  import { SpectralTimeStretcher } from "../../core/time-stretching/Spectral";
  import { TimeDomainHarmonicScaling } from "../../core/time-stretching/TimeDomainHarmoniScaling";
  import { PhaseVocoder } from "../../core/time-stretching/PhaseVocoder";
  import { Repeat2 } from "lucide-svelte";
  import IconButton from "../ui/IconButton.svelte";

  let processing = false;
  let originalBuffer;
  let processedBuffer;
  let context;

  const windowSizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  const hopSizes = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
  const windowFuncs = ["hann", "hamming", "blackman", "helge"];

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
  let stretchFactor = 0.9;
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
  }

  async function loadAudio(event) {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      originalBuffer = await context.decodeAudioData(arrayBuffer);
      processedBuffer = originalBuffer;

      originalDuration = originalBuffer.duration;
      processedDuration = processedBuffer.duration;
    }
  }

  function processAudio() {
    processing = true;

    console.log(`[START] Processing audio with method: ${method}`);

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
            stretchFactor: stretchFactor,
            windowSize: params.windowSize,
            hopSize: params.hopSize,
            windowType: params.windowType,
          });

          processedBuffer = engine.process(originalBuffer);

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
            stretchFactor: stretchFactor,
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
    } catch (error) {
      console.error("Error processing audio:", error);
      alert(`Error processing audio: ${error.message}`);
    } finally {
      processing = false;
    }
    console.log("[END] Finished Processing audio");
  }

  let currentSource;
  let loop = false;
  let playing = false;
  let currentSegment = null;

  function toggleLooping() {
    if (loop) {
      stopAudio();
    }

    loop = !loop;
  }

  function playSegment(segment) {
    currentSegment = {
      start: segment.start / 1000,
      end: segment.end / 1000,
      duration: (segment.end - segment.start) / 1000,
    };

    playAudio(segment.buffer); // Set loop to true for segments
  }

  function playAudio(buffer) {
    stopAudio();

    currentSource = context.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(audioManager.mixer);
    currentSource.loop = loop;
    currentSource.start();

    playing = true;

    startTime = context.currentTime;
    duration = currentSegment ? currentSegment.duration : buffer.duration;
    elapsed = 0;

    progressAnimationFrameId = requestAnimationFrame(updateProgress);
  }

  function updateProgress() {
    const currentTime = context.currentTime;
    elapsed = currentTime - startTime;

    if (currentSegment) {
      // Segment playback
      const segmentDuration = currentSegment.duration;
      const segmentElapsed = elapsed % segmentDuration;
      const segmentProgress = segmentElapsed / segmentDuration;

      progress =
        currentSegment.start / originalBuffer.duration +
        (segmentProgress * (currentSegment.end - currentSegment.start)) / originalBuffer.duration;

      if (elapsed >= segmentDuration && !loop) {
        stopAudio();
        return;
      }
    } else {
      // Full audio playback
      const fullDuration = currentSource.buffer.duration;
      const fullElapsed = elapsed % fullDuration;
      progress = fullElapsed / fullDuration;

      if (elapsed >= fullDuration && !loop) {
        stopAudio();
        return;
      }
    }

    if (playing) {
      progressAnimationFrameId = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(progressAnimationFrameId);
      progress = 0;
    }
  }

  function stopAudio() {
    if (!currentSource) return;
    cancelAnimationFrame(progressAnimationFrameId);
    currentSegment = null;
    playing = false;
    currentSource.stop();
    currentSource.disconnect();
    currentSource = null;
  }

  let maxDuration = 0;

  let originalPath = "";
  let processedPath = "";

  $: if (originalBuffer && processedBuffer) {
    updateMaxDuration();
    originalPath = generateWaveformPath(originalBuffer, 1000, 128);
    processedPath = generateWaveformPath(processedBuffer, 1000, 128);
  }

  function updateMaxDuration() {
    maxDuration = Math.max(originalBuffer?.duration || 0, processedBuffer?.duration || 0);
    originalDuration = originalBuffer?.duration || 0;
    processedDuration = processedBuffer?.duration || 0;
  }

  function generateWaveformPath(buffer, width, height) {
    if (!buffer) return "";

    const data = buffer.getChannelData(0);
    const duration = buffer.duration;
    const pixelsPerSecond = width / maxDuration;
    const totalWidth = Math.ceil(duration * pixelsPerSecond);

    const samplesPerPixel = Math.max(1, Math.floor(data.length / totalWidth));
    const amp = height / 2;

    let path = "";
    for (let x = 0; x < totalWidth; x++) {
      const start = x * samplesPerPixel;
      const end = start + samplesPerPixel;
      let min = 1;
      let max = -1;

      for (let i = start; i < end; i++) {
        const sample = data[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      path += `M${x},${(1 + min) * amp} L${x},${(1 + max) * amp}`;
    }

    return path;
  }

  function switchMethod(newMethod) {
    localStorage.setItem("synthesisMethod", newMethod);

    method = newMethod;
    params = synthesisParams[method].reduce((acc, param) => {
      acc[param.name] = param.default;
      return acc;
    }, {});
  }

  let segments = [];
  let activeSegment = null;
  let mousePosition = null;

  function handleMouseDown(event, buffer, which) {
    whichBuffer = which;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickTime = (x / rect.width) * buffer.duration * 1000; // Convert to ms

    activeSegment = { start: clickTime, end: clickTime };
    mousePosition = x;
  }

  function handleMouseMove(event, buffer, which) {
    if (activeSegment) {
      whichBuffer = which;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      mousePosition = x;
      const currentTime = (x / rect.width) * buffer.duration * 1000;
      activeSegment.end = currentTime;
    }
  }

  function handleMouseUp(event, buffer, which) {
    if (activeSegment) {
      whichBuffer = which;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const endTime = (x / rect.width) * buffer.duration * 1000;

      // Clamp the start and end times to the buffer boundaries
      const start = Math.max(0, Math.min(activeSegment.start, endTime));
      const end = Math.min(buffer.duration * 1000, Math.max(activeSegment.start, endTime));

      // Convert milliseconds to samples
      const startSample = Math.floor((start / 1000) * buffer.sampleRate);
      const endSample = Math.floor((end / 1000) * buffer.sampleRate);
      const sampleCount = endSample - startSample;

      if (sampleCount < 100) {
        activeSegment = null;
        return;
      }

      // Create a new AudioBuffer for the segment
      const segmentBuffer = audioManager.audioContext.createBuffer(
        buffer.numberOfChannels,
        sampleCount,
        buffer.sampleRate,
      );

      // Copy the data from the original buffer to the segment buffer
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        segmentBuffer.copyToChannel(channelData.subarray(startSample, endSample), channel);
      }

      // Generate waveform for the segment
      const segmentWaveform = generateWaveformPath(segmentBuffer, 1000, 128);

      segments = [
        ...segments,
        {
          which,
          start,
          end,
          buffer: segmentBuffer,
          waveform: segmentWaveform,
        },
      ];
      activeSegment = null;
      mousePosition = null;
    }
  }

  let splits = [];

  function splitSegment(event, buffer, which) {
    whichBuffer = which;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const splitTime = (x / rect.width) * buffer.duration * 1000;
    const firstBuffer = audioManager.extractAudioSegment(buffer, 0, splitTime);
    const firstWaveform = generateWaveformPath(firstBuffer, 1000, 128);
    const first = { which, start: 0, end: splitTime, buffer: firstBuffer, waveform: firstWaveform };

    const lastBuffer = audioManager.extractAudioSegment(buffer, splitTime, buffer.duration * 1000);
    const lastWaveform = generateWaveformPath(lastBuffer, 1000, 128);
    const last = { which, start: splitTime, end: buffer.duration * 1000, buffer: lastBuffer, waveform: lastWaveform };

    splits = [splitTime];
    segments = [first, last];
    activeSegment = null;
    mousePosition = null;
  }

  function cancelActiveSegment(buffer) {
    if (activeSegment) {
      const start = Math.max(0, Math.min(activeSegment.start, activeSegment.end));
      const end = Math.min(buffer.duration * 1000, Math.max(activeSegment.start, activeSegment.end));

      const segmentBuffer = audioManager.extractAudioSegment(buffer, start, end);
      const segmentWaveform = generateWaveformPath(segmentBuffer, 1000, 128);

      segments = [
        ...segments,
        {
          start,
          end,
          buffer: segmentBuffer,
          waveform: segmentWaveform,
        },
      ];
      activeSegment = null;
      mousePosition = null;
    }
  }

  function clearSegments() {
    segments = [];
  }

  function downloadAudioBuffer(buffer) {
    audioManager.downloadBufferAsWave(buffer, "segment.wav");
  }

  function removeSegment(index) {
    segments = segments.filter((_, i) => i !== index);
  }

  let whichBuffer;

  $: splitLines = splits.map((split) => {
    return (split / (originalBuffer?.duration * 1000 || 1)) * 1000;
  });

  $: segmentRects = segments.map((segment) => {
    const startX = (segment.start / (originalBuffer?.duration * 1000 || 1)) * 1000;
    const endX = (segment.end / (originalBuffer?.duration * 1000 || 1)) * 1000;

    return `M${startX},0 L${startX},128 L${endX},128 L${endX},0 Z`;
  });

  $: activeSegmentRect = activeSegment
    ? (() => {
        const startX = (activeSegment.start / (originalBuffer?.duration * 1000 || 1)) * 1000;
        const endX = (activeSegment.end / (originalBuffer?.duration * 1000 || 1)) * 1000;
        return `M${startX},0 L${startX},128 L${endX},128 L${endX},0 Z`;
      })()
    : null;

  $: processedSegmentRects = segments.map((segment) => {
    const startX = (segment.start / (processedBuffer?.duration * 1000 || 1)) * 1000;
    const endX = (segment.end / (processedBuffer?.duration * 1000 || 1)) * 1000;

    return `M${startX},0 L${startX},128 L${endX},128 L${endX},0 Z`;
  });

  $: activeProcessedSegmentRect = activeSegment
    ? (() => {
        const startX = (activeSegment.start / (processedBuffer?.duration * 1000 || 1)) * 1000;
        const endX = (activeSegment.end / (processedBuffer?.duration * 1000 || 1)) * 1000;
        return `M${startX},0 L${startX},128 L${endX},128 L${endX},0 Z`;
      })()
    : null;
</script>

<div class="mx-auto my-12 flex w-full max-w-4xl flex-col gap-3 rounded border border-dark-600 bg-dark-800 p-4">
  <div class="flex flex-row items-end justify-between">
    <div class="flex flex-col gap-1">
      <label for="audioFile" class=" block text-xs text-accent-yellow">Controls</label>
      <div class="flex flex-row gap-3">
        <SegmentGroup>
          <TextButton on:click={processAudio}>
            <Waveform size="24" class="-mx-1 text-accent-yellow" />
          </TextButton>
          <IconButton icon={Repeat2} on:click={toggleLooping} additionalClasses={loop ? "!text-accent-yellow" : ""} />

          <TextButton on:click={() => playAudio(originalBuffer)}>Original</TextButton>
          <TextButton on:click={() => playAudio(processedBuffer)}>Processed</TextButton>
        </SegmentGroup>
      </div>
    </div>
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
  <div class="flex flex-row items-end justify-between">
    <div>
      <label for="audioFile" class="mb-1 block text-xs text-accent-yellow">Load Audio File</label>
      <input
        type="file"
        id="audioFile"
        accept="audio/*"
        on:change={loadAudio}
        class="h-10 w-full cursor-pointer rounded text-light-soft file:mr-4 file:rounded file:border-0 file:bg-dark-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-light hover:file:cursor-pointer hover:file:bg-dark-200"
      />
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
  </div>

  <div class="flex flex-col gap-6">
    <div>
      <label for="method" class="mb-2 block text-xs text-accent-yellow">Original Audio</label>
      <div class="relative rounded border border-dark-300 bg-gray-950">
        {#if originalDuration}
          <span class="absolute right-2 top-2 text-xs text-light/50">{originalDuration?.toFixed(3)}s</span>
        {/if}
        <div class="relative">
          <svg
            width="100%"
            height="128"
            viewBox="0 0 1000 128"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            class="h-32 w-full py-2"
          >
            <path d={originalPath} stroke="#61dafb" stroke-width="1" fill="none" vector-effect="non-scaling-stroke" />

            {#if splitLines.length > 0}
              {#each segmentRects as rect, i}
                <path
                  d={rect}
                  fill={i === 0 ? "rgba(50, 120, 255, 0.2)" : "rgba(0, 255, 255, 0.2)"}
                  stroke={i === 0 ? "rgba(50, 120, 255, 0.7)" : "rgba(0, 255, 255, 0.7)"}
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              {/each}
            {:else}
              {#each segmentRects as rect, i}
                <path
                  d={rect}
                  fill={whichBuffer === "original" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"}
                  stroke={whichBuffer === "original" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"}
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              {/each}
            {/if}

            {#each splitLines as splitPosition}
              <line
                x1={splitPosition}
                x2={splitPosition}
                y1="0"
                y2="128"
                stroke="red"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            {/each}

            {#if activeSegmentRect}
              <path
                d={activeSegmentRect}
                fill={whichBuffer === "original" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"}
                stroke={whichBuffer === "original" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"}
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            {/if}
          </svg>
          <div
            aria-hidden="true"
            class="absolute inset-0 cursor-pointer"
            on:dblclick|preventDefault={(e) => splitSegment(e, originalBuffer, "original")}
            on:mousedown={(e) => handleMouseDown(e, originalBuffer, "original")}
            on:mousemove={(e) => handleMouseMove(e, originalBuffer, "original")}
            on:mouseup={(e) => handleMouseUp(e, originalBuffer, "original")}
            on:mouseleave={() => cancelActiveSegment(originalBuffer, "original")}
          ></div>
        </div>

        <div
          class="pointer-events-none absolute inset-0 bottom-0 flex w-full items-center justify-start overflow-hidden overflow-hidden"
        >
          <div class="absolute h-full border-r border-red-600 bg-accent-neon/5" style="width: {progress * 100}%;"></div>
        </div>
      </div>
    </div>

    <div>
      <label for="method" class="mb-2 block text-xs text-accent-yellow">Processed Audio</label>
      <div class="relative rounded border border-dark-300 bg-gray-950">
        {#if processedDuration}
          <span class="absolute right-2 top-2 text-xs text-light/50">{processedDuration?.toFixed(3)}s</span>
        {/if}
        <div class="relative">
          <svg
            width="100%"
            height="128"
            viewBox="0 0 1000 128"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            class="h-32 w-full py-2"
          >
            <path
              d={processedPath}
              class="text-yellow-300"
              stroke="currentColor"
              stroke-width="1"
              fill="none"
              vector-effect="non-scaling-stroke"
            />

            {#if splitLines.length > 0}
              {#each processedSegmentRects as rect, i}
                <path
                  d={rect}
                  fill={i === 0 ? "rgba(50, 120, 255, 0.2)" : "rgba(0, 255, 255, 0.2)"}
                  stroke={i === 0 ? "rgba(50, 120, 255, 0.7)" : "rgba(0, 255, 255, 0.7)"}
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              {/each}
            {:else}
              {#each processedSegmentRects as rect, i}
                <path
                  d={rect}
                  fill={whichBuffer === "processed" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"}
                  stroke={whichBuffer === "processed" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"}
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              {/each}
            {/if}

            {#each splitLines as splitPosition}
              <line
                x1={splitPosition}
                x2={splitPosition}
                y1="0"
                y2="128"
                stroke="red"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            {/each}

            {#if activeProcessedSegmentRect}
              <path
                d={activeProcessedSegmentRect}
                fill={whichBuffer === "processed" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"}
                stroke={whichBuffer === "processed" ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"}
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            {/if}
          </svg>
          <div
            aria-hidden="true"
            class="absolute inset-0 cursor-pointer"
            on:dblclick|preventDefault={(e) => splitSegment(e, processedBuffer, "processed")}
            on:mousedown={(e) => handleMouseDown(e, processedBuffer, "processed")}
            on:mousemove={(e) => handleMouseMove(e, processedBuffer, "processed")}
            on:mouseup={(e) => handleMouseUp(e, processedBuffer, "processed")}
            on:mouseleave={() => cancelActiveSegment(processedBuffer, "processed")}
          ></div>
        </div>

        <div
          class="pointer-events-none absolute inset-0 bottom-0 flex w-full items-center justify-start overflow-hidden"
        >
          <div
            class="absolute h-full border-r border-red-600 bg-accent-yellow/10"
            style="width: {progress * 100}%;"
          ></div>
        </div>
      </div>
    </div>

    {#if segments.length > 0 || activeSegment}
      <div class="mb-6 mt-3">
        <div class="mb-2 flex items-center justify-between gap-3">
          <h3 class="block text-xs text-accent-yellow">Segments</h3>
          {#if segments.length > 0}
            <button class="px-2 text-xs text-red-500 hover:text-red-700" on:click={clearSegments}> Remove all</button>
          {/if}
        </div>
        <ul class="flex flex-col gap-2">
          {#each segments as segment, i}
            <li class="flex w-full flex-col items-center justify-center rounded bg-dark-600 p-2">
              <div class="mb-1 flex w-full items-center justify-between text-sm">
                <button
                  on:click={() => downloadAudioBuffer(segment.buffer)}
                  class="flex flex-row items-center justify-center gap-1 text-xs text-accent-yellow hover:opacity-80"
                >
                  <DownloadSimple size="14" />
                  <span class="text-light">
                    {segment.start.toFixed(2)}ms - {segment.end.toFixed(2)}ms
                  </span>
                  <span class="text-xs text-light-soft">({segment.which})</span>
                </button>
                <div class="flex flex-row gap-6">
                  <button on:click={() => removeSegment(i)} class="text-red-500 hover:text-red-700">Remove</button>
                </div>
              </div>
              <button on:click={() => playSegment(segment)} class="w-full bg-gray-950">
                <svg
                  width="100%"
                  height="128"
                  viewBox="0 0 1000 128"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-16 w-full py-2"
                >
                  <path
                    d={segment.waveform}
                    class="text-accent-neon"
                    stroke="currentColor"
                    stroke-width="1"
                    fill="none"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </button>
            </li>
          {/each}

          {#if activeSegment}
            <li class="rounded bg-dark-600 p-2">
              <span class="block text-sm text-light">
                {activeSegment.start.toFixed(2)}ms - (In progress)
              </span>
            </li>
          {/if}
        </ul>
      </div>
    {/if}
  </div>
</div>

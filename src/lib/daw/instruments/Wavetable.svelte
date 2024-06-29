<script>
  import { onDestroy, onMount } from "svelte";
  import Knob from "../../ui/Knob.svelte";
  import Value from "../../ui/Input/Value.svelte";
  import { audioManager } from "../../../core/audio.js";

  let canvas;

  let morph = 0.5;
  let frequency = 140;
  let harmonics = 8;
  let numOscillators = 3;
  let detune = 10;
  let spread = 0.2;

  let buzzIntensity = 0;
  let buzzFrequency = 110;

  let audioContext, gainNode;
  let wavetables = [];
  let oscillators = [];
  let isPlaying = false;
  const wavetableSize = 512;
  const numWavetables = 16;

  function generateWavetable() {
    const wavetable = new Float32Array(wavetableSize);
    const numPartials = Math.floor(Math.random() * harmonics) + 1; // Random number of partials
    const partialAmplitudes = [];
    const partialPhases = [];

    // Generate random amplitudes and phases for each partial
    for (let i = 0; i < numPartials; i++) {
      partialAmplitudes.push(Math.random());
      partialPhases.push(Math.random() * 2 * Math.PI);
    }

    // Normalize amplitudes
    const totalAmplitude = partialAmplitudes.reduce((sum, amp) => sum + amp, 0);
    const normalizedAmplitudes = partialAmplitudes.map((amp) => amp / totalAmplitude);

    for (let i = 0; i < wavetableSize; i++) {
      let sample = 0;
      for (let h = 0; h < numPartials; h++) {
        const frequency = h + 1; // Fundamental and overtones
        sample += normalizedAmplitudes[h] * Math.sin((2 * Math.PI * frequency * i) / wavetableSize + partialPhases[h]);
      }
      wavetable[i] = sample;
    }
    return wavetable;
  }

  function normalizeWavetable(wavetable) {
    const max = Math.max(...wavetable);
    const min = Math.min(...wavetable);
    const range = Math.max(Math.abs(max), Math.abs(min));
    return wavetable.map((sample) => sample / range);
  }

  function initializeWavetables() {
    wavetables = [];
    for (let i = 0; i < numWavetables; i++) {
      wavetables.push(normalizeWavetable(generateWavetable()));
    }
  }

  function generateWaspNoise(length) {
    const noise = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      noise[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  function addBuzzEffect(wavetable, intensity) {
    const waspNoise = generateWaspNoise(wavetable.length);

    return wavetable.map((sample, i) => {
      const buzz = waspNoise[i] * Math.sin((2 * Math.PI * buzzFrequency * i) / wavetable.length);
      return sample + buzz * intensity;
    });
  }

  function interpolateWavetables(t) {
    if (wavetables.length === 0) {
      console.warn("Wavetables array is empty, reinitializing...");
      initializeWavetables();
      if (wavetables.length === 0) {
        console.error("Failed to reinitialize wavetables");
        return new Float32Array(wavetableSize);
      }
    }

    const index = t * (wavetables.length - 1);
    const lowIndex = Math.floor(index);
    const highIndex = Math.min(Math.ceil(index), wavetables.length - 1);
    const blend = index - lowIndex;

    let interpolatedWavetable = new Float32Array(wavetableSize);
    for (let i = 0; i < wavetableSize; i++) {
      const lowSample = wavetables[lowIndex][i];
      const highSample = wavetables[highIndex][i];

      interpolatedWavetable[i] = lowSample * (1 - blend) + highSample * blend;
    }

    if (buzzIntensity > 0) {
      interpolatedWavetable = addBuzzEffect(interpolatedWavetable, buzzIntensity / 100);
    }

    return interpolatedWavetable;
  }

  function drawWaveform(wavetable) {
    if (!canvas) return;
    if (!wavetable) return;

    console.log("drawing waveform");
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    for (let x = 0; x < canvas.width; x++) {
      const index = Math.floor((x / canvas.width) * wavetableSize);
      const y = (1 - wavetable[index]) * 0.5 * canvas.height;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#61dafb";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateWavetable() {
    const baseWavetable = interpolateWavetables(morph);
    drawWaveform(baseWavetable);

    if (isPlaying) {
      updateOscillators();
    }
  }

  function initAudio() {
    audioContext = audioManager.audioContext;
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.8 / Math.sqrt(numOscillators), audioContext.currentTime);
    gainNode.connect(audioManager.mixer);
  }

  function createOscillators() {
    stopOscillators();
    oscillators = [];
    for (let i = 0; i < numOscillators; i++) {
      const osc = audioContext.createOscillator();
      osc.connect(gainNode);
      oscillators.push(osc);
    }
  }

  function updateOscillators() {
    if (!audioContext) {
      console.warn("Audio context not initialized");
      return;
    }

    oscillators.forEach((osc, index) => {
      try {
        const spreadAmount = (index / (oscillators.length - 1) - 0.5) * 2;
        const morphPosition = Math.max(0, Math.min(1, morph + spread * spreadAmount));
        const wavetable = interpolateWavetables(morphPosition);

        const real = new Float32Array(wavetable.length);
        const imag = new Float32Array(wavetable.length);
        for (let i = 0; i < wavetable.length; i++) {
          real[i] = wavetable[i];
          imag[i] = 0;
        }
        const wave = audioContext.createPeriodicWave(real, imag, { disableNormalization: true });
        osc.setPeriodicWave(wave);

        osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
        osc.detune.setValueAtTime(spreadAmount * detune, audioContext.currentTime);
      } catch (error) {
        console.error("Error updating oscillator:", error);
      }
    });

    if (gainNode) {
      gainNode.gain.setValueAtTime(0.8 / Math.sqrt(numOscillators), audioContext.currentTime);
    }
  }

  function stopOscillators() {
    oscillators.forEach((osc) => {
      if (osc.started) {
        try {
          osc.stop();
        } catch (error) {
          console.warn("Error stopping oscillator:", error);
        }
      }
    });
    oscillators = [];
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      stopOscillators();
      if (gainNode) gainNode.disconnect();
    } else {
      createOscillators();
      updateOscillators();
      oscillators.forEach((osc) => {
        osc.start();
        osc.started = true;
      });
    }
    isPlaying = !isPlaying;
  };

  onMount(() => {
    initAudio();
    initializeWavetables();
    updateWavetable();
  });

  onDestroy(() => {
    if (isPlaying) {
      stopOscillators();
    }
    if (gainNode) {
      gainNode.disconnect();
    }
  });

  $: handleMorphChange(morph);
  $: handleFrequencyChange(frequency);
  $: handleHarmonicsChange(harmonics);
  $: handleOscCountChange(numOscillators);
  $: handleDetuneChange(detune);
  $: handleSpreadChange(spread);
  $: handleBuzzChange(buzzIntensity, buzzFrequency);

  function handleBuzzChange(value) {
    if (isPlaying && audioContext) {
      updateOscillators();
    }
    updateWavetable();
  }

  function handleMorphChange(value) {
    updateWavetable();
  }

  function handleFrequencyChange() {
    if (isPlaying && audioContext) {
      updateOscillators();
    }
  }

  function handleHarmonicsChange() {
    initializeWavetables();
    updateWavetable();
  }

  function handleOscCountChange() {
    if (isPlaying && audioContext) {
      stopOscillators();
      createOscillators();
      updateOscillators();
    }
  }

  function handleDetuneChange() {
    if (isPlaying && audioContext) {
      updateOscillators();
    }
  }

  function handleSpreadChange() {
    if (isPlaying && audioContext) {
      updateOscillators();
    }
  }
</script>

<main class="flex max-w-4xl flex-col rounded-lg border border-dark-900 bg-dark-400 p-6">
  <div class="relative rounded border border-dark-300 bg-gray-950 py-3">
    <canvas bind:this={canvas} width="800" height="200"></canvas>
  </div>
  <div class="grid grid-cols-6 gap-3">
    <div class="flex flex-col gap-1">
      <Value label="Morph" value={morph.toFixed(2)} />
      <Knob min="0" max="1" step="0.01" bind:value={morph} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Frequency" value={frequency.toFixed(2)} />
      <Knob min="20" max="2000" step="1" bind:value={frequency} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Harmonics" value={harmonics.toFixed(2)} />
      <Knob min="1" max="100" step="1" bind:value={harmonics} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Oscillators" value={numOscillators.toFixed(2)} />
      <Knob min="1" max="8" step="1" bind:value={numOscillators} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Detune" value={detune.toFixed(2)} />
      <Knob min="0" max="100" step="1" bind:value={detune} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Spread" value={spread.toFixed(2)} />
      <Knob min="0" max="1" step="0.01" bind:value={spread} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Buzz" value={buzzIntensity.toFixed(2)} />
      <Knob min="0" max="100" step="1" bind:value={buzzIntensity} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Buzz Freq" value={buzzFrequency.toFixed(2)} />
      <Knob min="20" max="2000" step="1" bind:value={buzzFrequency} />
    </div>

    <div class="col-span-full">
      <button
        on:click={() => {
          initializeWavetables();
          updateWavetable();
        }}
      >
        Randomize Wavetables
      </button>
      <button on:click={togglePlayPause}>Play</button>
    </div>
  </div>
</main>

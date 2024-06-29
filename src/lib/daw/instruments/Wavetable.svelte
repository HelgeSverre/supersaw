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

  let attack = 0.1;
  let decay = 0.2;
  let sustain = 0.7;
  let release = 0.5;
  let filterCutoff = 1000;
  let resonance = 1;

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

  function applyEnvelope(param, startValue, endValue, duration) {
    const now = audioContext.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(startValue, now);
    param.linearRampToValueAtTime(endValue, now + duration);
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


  function drawWaveform() {
    if (!canvas || wavetables.length === 0) return;

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw spread waveforms
    for (let i = 0; i < numOscillators; i++) {
      const spreadAmount = calculateSpreadAmount(i, numOscillators, spread);
      const morphPosition = Math.max(0, Math.min(1, morph + spreadAmount));
      const wavetable = interpolateWavetables(morphPosition);

      // Calculate opacity based on spread and oscillator position
      const distanceFromCenter = Math.abs(i - (numOscillators - 1) / 2) / ((numOscillators - 1) / 2);
      const opacity = 1 - distanceFromCenter * spread;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(97, 218, 251, ${opacity.toFixed(2)})`;
      ctx.lineWidth = 2;

      for (let x = 0; x < canvas.width; x++) {
        const index = Math.floor((x / canvas.width) * wavetableSize);
        const y = (1 - wavetable[index]) * 0.5 * canvas.height;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    // Draw the main (center) waveform
    const centerWavetable = interpolateWavetables(morph);
    ctx.beginPath();
    ctx.strokeStyle = "#61dafb"; // Solid blue for the main waveform
    ctx.lineWidth = 2;

    for (let x = 0; x < canvas.width; x++) {
      const index = Math.floor((x / canvas.width) * wavetableSize);
      const y = (1 - centerWavetable[index]) * 0.5 * canvas.height;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  function calculateSpreadAmount(index, totalOscillators, spreadValue) {
    return (index / (totalOscillators - 1) - 0.5) * 2 * spreadValue;
  }

  function updateWavetable() {
    const baseWavetable = interpolateWavetables(morph);
    drawWaveform(baseWavetable);

    if (isPlaying) {
      updateOscillators();
    }
  }

  let filterNode;

  function initAudio() {
    audioContext = audioManager.audioContext;

    // Gain
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.8 / Math.sqrt(numOscillators), audioContext.currentTime);

    // Filter
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(filterCutoff, audioContext.currentTime);
    filterNode.Q.setValueAtTime(resonance, audioContext.currentTime);

    gainNode.connect(filterNode);
    filterNode.connect(audioManager.mixer);
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
        const spreadAmount = calculateSpreadAmount(index, numOscillators, spread);
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

    filterNode.frequency.setValueAtTime(filterCutoff, audioContext.currentTime);
    filterNode.Q.setValueAtTime(resonance, audioContext.currentTime);

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
      // Release
      applyEnvelope(gainNode.gain, gainNode.gain.value, 0, release);

      setTimeout(() => {
        stopOscillators();
        gainNode.disconnect();
      }, release * 1000);
    } else {
      initAudio();

      createOscillators();
      updateOscillators();
      oscillators.forEach((osc) => {
        osc.start();
        osc.started = true;
      });

      // Attack
      applyEnvelope(gainNode.gain, 0, 1, attack);
      // Decay and Sustain
      setTimeout(() => {
        applyEnvelope(gainNode.gain, 1, sustain, decay);
      }, attack * 1000);
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

  $: spread && drawWaveform();
  $: numOscillators && drawWaveform();
  $: handleMorphChange(morph);
  $: handleFrequencyChange(frequency);
  $: handleHarmonicsChange(harmonics);
  $: handleOscCountChange(numOscillators);
  $: handleDetuneChange(detune);
  $: handleSpreadChange(spread);
  $: handleBuzzChange(buzzIntensity, buzzFrequency);
  $: handleFilterCutoffChange(filterCutoff);
  $: handleResonanceChange(resonance);

  function handleFilterCutoffChange(value) {
    filterCutoff = value;
    if (isPlaying && audioContext) {
      updateOscillators();
    }
  }

  function handleResonanceChange(value) {
    resonance = value;
    if (isPlaying && audioContext) {
      updateOscillators();
    }
  }

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
    <canvas bind:this={canvas} width="2000" height="800" class="w-full "></canvas>
  </div>
  <div class="grid grid-cols-6 gap-3">
    <div class="flex flex-col gap-1">
      <Value label="Morph" value={morph.toFixed(3)} />
      <Knob min="0" max="1" step="0.001" bind:value={morph} />
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
      <Value label="Spread" value={spread.toFixed(3)} />
      <Knob min="0" max="1" step="0.001" bind:value={spread} />
    </div>

    <div class="flex flex-col gap-1">
      <Value label="Buzz" value={buzzIntensity.toFixed(2)} />
      <Knob min="0" max="100" step="1" bind:value={buzzIntensity} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Buzz Freq" value={buzzFrequency.toFixed(2)} />
      <Knob min="20" max="2000" step="1" bind:value={buzzFrequency} />
    </div>
  </div>
  <div class="grid grid-cols-6 gap-3">
    <div class="flex flex-col gap-1">
      <Value label="Attack" value={attack?.toFixed(2)} />
      <Knob min="0" max="2" step="0.01" bind:value={attack} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Decay" value={decay?.toFixed(2)} />
      <Knob min="0" max="2" step="0.01" bind:value={decay} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Sustain" value={sustain?.toFixed(2)} />
      <Knob min="0" max="1" step="0.01" bind:value={sustain} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Release" value={release?.toFixed(2)} />
      <Knob min="0" max="5" step="0.01" bind:value={release} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Filter Cutoff" value={filterCutoff?.toFixed(0)} />
      <Knob min="20" max="20000" step="1" bind:value={filterCutoff} />
    </div>
    <div class="flex flex-col gap-1">
      <Value label="Resonance" value={resonance?.toFixed(2)} />
      <Knob min="0" max="20" step="0.1" bind:value={resonance} />
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

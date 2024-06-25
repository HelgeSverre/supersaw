<script>
  import { writable } from "svelte/store";

  const context = new (window.AudioContext || window.webkitAudioContext)();

  const tracks = writable(
    Array(8)
      .fill()
      .map(() => ({
        volume: 1,
        pan: 0,
        pitch: 1,
        sample: null,
        buffer: null,
      })),
  );

  let fileInputs = [];

  function loadSample(index, event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        tracks.update((t) => {
          t[index].buffer = audioBuffer;
          return t;
        });
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function triggerSample(index) {
    tracks.subscribe((t) => {
      const track = t[index];
      if (track.buffer) {
        const source = context.createBufferSource();
        const gainNode = context.createGain();
        const panNode = context.createStereoPanner();

        source.buffer = track.buffer;
        source.playbackRate.value = track.pitch;
        gainNode.gain.value = track.volume;
        panNode.pan.value = track.pan;

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(context.destination);

        source.start(0);
      }
    })();
  }

  function setVolume(index, event) {
    const volume = parseFloat(event.target.value);
    tracks.update((t) => {
      t[index].volume = volume;
      return t;
    });
  }

  function setPan(index, event) {
    const pan = parseFloat(event.target.value);
    tracks.update((t) => {
      t[index].pan = pan;
      return t;
    });
  }

  function setPitch(index, event) {
    const pitch = parseFloat(event.target.value);
    tracks.update((t) => {
      t[index].pitch = pitch;
      return t;
    });
  }
</script>

<div class="mx-auto grid w-full max-w-xl grid-cols-3 gap-6">
  {#each $tracks as track, index}
    <div class="flex flex-col border border-dark-600 bg-dark-800 p-3">
      <label
        >Volume: <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          on:input={(e) => setVolume(index, e)}
        /></label
      >
      <label
        >Pan: <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          on:input={(e) => setPan(index, e)}
        /></label
      >
      <label
        >Pitch: <input
          type="range"
          min="0.5"
          max="2"
          step="0.01"
          value={track.pitch}
          on:input={(e) => setPitch(index, e)}
        /></label
      >

      <input type="file" accept="audio/*" on:change={(e) => loadSample(index, e)} />
      <button on:click={() => triggerSample(index)}>Trigger</button>
    </div>
  {/each}
</div>

<script>
  import { audioManager } from "../../core/audio.js";
  import { Search } from "lucide-svelte";

  let search = "";
  let open = false;

  const kits = [
    {
      open: false,
      label: "LinnDrum",
      kit: "linndrum",
      samples: [
        "cabasa.wav",
        "chh.wav",
        "chhl.wav",
        "chhs.wav",
        "clap.wav",
        "conga.wav",
        "congah.wav",
        "congahh.wav",
        "congal.wav",
        "congall.wav",
        "congalll.wav",
        "cowb.wav",
        "crash.wav",
        "kick.wav",
        "kickme.wav",
        "ride.wav",
        "sd.wav",
        "sdh.wav",
        "sdl.wav",
        "sst.wav",
        "ssth.wav",
        "sstl.wav",
        "tamb.wav",
        "tom.wav",
        "tomh.wav",
        "tomhh.wav",
        "toml.wav",
        "tomll.wav",
      ],
    },
    {
      open: false,
      label: "Roland CR-80",
      kit: "roland-cr-80",
      samples: [
        "CR80_Ahh.wav",
        "CR80_BD.wav",
        "CR80_Chh.wav",
        "CR80_Crash.wav",
        "CR80_Ha.wav",
        "CR80_Hey.wav",
        "CR80_Ohh.wav",
        "CR80_Ride.wav",
        "CR80_Scratch1.wav",
        "CR80_Scratch2.wav",
        "CR80_Snare.wav",
        "CR80_Tom.wav",
        "CR80_Uuh.wav",
      ],
    },

    {
      open: false,
      label: "Roland TR-909",
      kit: "roland-tr-909",
      samples: [
        "BT0A0A7.WAV",
        "BT0A0D0.WAV",
        "BT0A0D3.WAV",
        "BT0A0DA.WAV",
        "BT0AAD0.WAV",
        "BT0AADA.WAV",
        "BT3A0D0.WAV",
        "BT3A0D3.WAV",
        "BT3A0D7.WAV",
        "BT3A0DA.WAV",
        "BT3AAD0.WAV",
        "BT3AADA.WAV",
        "BT7A0D0.WAV",
        "BT7A0D3.WAV",
        "BT7A0D7.WAV",
        "BT7A0DA.WAV",
        "BT7AAD0.WAV",
        "BT7AADA.WAV",
        "BTAA0D0.WAV",
        "BTAA0D3.WAV",
        "BTAA0D7.WAV",
        "BTAA0DA.WAV",
        "BTAAAD0.WAV",
        "BTAAADA.WAV",
        "CLOP1.WAV",
        "CLOP2.WAV",
        "CLOP3.WAV",
        "CLOP4.WAV",
        "CSHD0.WAV",
        "CSHD2.WAV",
        "CSHD4.WAV",
        "CSHD6.WAV",
        "CSHD8.WAV",
        "CSHDA.WAV",
        "HANDCLP1.WAV",
        "HANDCLP2.WAV",
        "HHCD0.WAV",
        "HHCD2.WAV",
        "HHCD4.WAV",
        "HHCD6.WAV",
        "HHCD8.WAV",
        "HHCDA.WAV",
        "HHOD0.WAV",
        "HHOD2.WAV",
        "HHOD4.WAV",
        "HHOD6.WAV",
        "HHOD8.WAV",
        "HHODA.WAV",
        "HT0D0.WAV",
        "HT0D3.WAV",
        "HT0D7.WAV",
        "HT0DA.WAV",
        "HT3D0.WAV",
        "HT3D3.WAV",
        "HT3D7.WAV",
        "HT3DA.WAV",
        "HT7D0.WAV",
        "HT7D3.WAV",
        "HT7D7.WAV",
        "HT7DA.WAV",
        "HTAD0.WAV",
        "HTAD3.WAV",
        "HTAD7.WAV",
        "HTADA.WAV",
        "LT0D0.WAV",
        "LT0D3.WAV",
        "LT0D7.WAV",
        "LT0DA.WAV",
        "LT3D0.WAV",
        "LT3D3.WAV",
        "LT3D7.WAV",
        "LT3DA.WAV",
        "LT7D0.WAV",
        "LT7D3.WAV",
        "LT7D7.WAV",
        "LT7DA.WAV",
        "LTAD0.WAV",
        "LTAD3.WAV",
        "LTAD7.WAV",
        "LTADA.WAV",
        "MT0D0.WAV",
        "MT0D3.WAV",
        "MT0D7.WAV",
        "MT0DA.WAV",
        "MT3D0.WAV",
        "MT3D3.WAV",
        "MT3D7.WAV",
        "MT3DA.WAV",
        "MT7D0.WAV",
        "MT7D3.WAV",
        "MT7D7.WAV",
        "MT7DA.WAV",
        "MTAD0.WAV",
        "MTAD3.WAV",
        "MTAD7.WAV",
        "MTADA.WAV",
        "OPCL1.WAV",
        "OPCL2.WAV",
        "OPCL3.WAV",
        "OPCL4.WAV",
        "RIDED0.WAV",
        "RIDED2.WAV",
        "RIDED4.WAV",
        "RIDED6.WAV",
        "RIDED8.WAV",
        "RIDEDA.WAV",
        "RIM63.WAV",
        "RIM127.WAV",
        "ST0T0S0.WAV",
        "ST0T0S3.WAV",
        "ST0T0S7.WAV",
        "ST0T0SA.WAV",
        "ST0T3S3.WAV",
        "ST0T3S7.WAV",
        "ST0T3SA.WAV",
        "ST0T7S3.WAV",
        "ST0T7S7.WAV",
        "ST0T7SA.WAV",
        "ST0TAS3.WAV",
        "ST0TAS7.WAV",
        "ST0TASA.WAV",
        "ST3T0S0.WAV",
        "ST3T0S3.WAV",
        "ST3T0S7.WAV",
        "ST3T0SA.WAV",
        "ST3T3S3.WAV",
        "ST3T3S7.WAV",
        "ST3T3SA.WAV",
        "ST3T7S3.WAV",
        "ST3T7S7.WAV",
        "ST3T7SA.WAV",
        "ST3TAS3.WAV",
        "ST3TAS7.WAV",
        "ST3TASA.WAV",
        "ST7T0S0.WAV",
        "ST7T0S3.WAV",
        "ST7T0S7.WAV",
        "ST7T0SA.WAV",
        "ST7T3S3.WAV",
        "ST7T3S7.WAV",
        "ST7T3SA.WAV",
        "ST7T7S3.WAV",
        "ST7T7S7.WAV",
        "ST7T7SA.WAV",
        "ST7TAS3.WAV",
        "ST7TAS7.WAV",
        "ST7TASA.WAV",
        "STAT0S0.WAV",
        "STAT0S3.WAV",
        "STAT0S7.WAV",
        "STAT0SA.WAV",
        "STAT3S3.WAV",
        "STAT3S7.WAV",
        "STAT3SA.WAV",
        "STAT7S3.WAV",
        "STAT7S7.WAV",
        "STAT7SA.WAV",
        "STATAS3.WAV",
        "STATAS7.WAV",
        "STATASA.WAV",
      ],
    },
  ];

  function handleDragStart(kit, sample) {
    return function (event) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          action: "clip:add",
          path: `/samples/${kit}/${sample}`,
          name: `${kit} - ${sample}`,
        }),
      );
    };
  }

  function previewSample(path) {
    audioManager.playPreview(path);
  }

  function clickOutside(element, callbackFunction) {
    function onClick(event) {
      if (!element.contains(event.target)) {
        callbackFunction();
      }
    }

    document.body.addEventListener("click", onClick);

    return {
      update(newCallbackFunction) {
        callbackFunction = newCallbackFunction;
      },
      destroy() {
        document.body.removeEventListener("click", onClick);
      },
    };
  }
</script>

<div class="relative w-full">
  <!-- File browser tree of samples to drag n drop into tracks -->
  <div class=" h-fit w-full rounded bg-dark-400">
    <div class="absolute inset-y-0 left-2 flex items-center justify-center">
      <Search size="16" class="text-light-soft" />
    </div>

    <input
      bind:value={search}
      on:focus={() => (open = true)}
      type="search"
      placeholder="Search samples..."
      class="h-10 w-full text-ellipsis bg-transparent pl-8 text-sm font-normal placeholder-light-secondary/50 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
    />
  </div>

  <div class="file-browser" style="display: {open ? 'block' : 'none'};" use:clickOutside={() => (open = false)}>
    <div class="file-browser-header">
      <h3>File Browser</h3>
    </div>
    <div class="file-browser-body">
      <div class="file-browser-tree">
        <ul>
          {#each kits as kit}
            <li>
              <span class="file-browser-folder">
                <button on:click={() => (kit.open = !kit.open)}>{kit.label}</button>
              </span>

              <ul style="display: {kit.open || search.trim() !== '' ? 'block' : 'none'};">
                {#each kit.samples.filter((sample) => sample.includes(search)) as file}
                  <li>
                    <button
                      class="file-browser-file"
                      draggable="true"
                      on:dragstart={handleDragStart(kit.kit, file)}
                      on:click={() => previewSample(`/samples/${kit.kit}/${file}`)}
                    >
                      {file}
                    </button>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .file-browser {
    position: absolute;
    left: 0;
    top: 50px;
    width: 100%;
    height: 600px;
    z-index: 1000;
    background-color: var(--dark-300);
    color: var(--text-primary);
    border: 1px solid var(--dark-100);
    border-radius: 5px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .file-browser-header {
    padding: 10px;
    background-color: var(--dark-200);
  }

  .file-browser-body {
    padding: 10px;
    overflow-y: auto;
  }

  .file-browser-tree ul {
    list-style-type: none;
    padding-left: 0;
  }

  .file-browser-tree ul li {
    padding-left: 10px;
  }

  .file-browser-folder {
    color: var(--accent-green);
    cursor: pointer;
    font-weight: 500;
  }

  .file-browser-file {
    color: var(--text-primary);
    cursor: pointer;
  }

  .file-browser-folder:hover,
  .file-browser-file:hover {
    color: var(--accent-yellow);
  }
</style>

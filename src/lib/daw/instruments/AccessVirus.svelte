<script>
  import LED from "../../ui/LED.svelte";
  import LCD from "../../ui/LCD.svelte";
</script>

<main class="flex h-full w-full flex-col items-center justify-center gap-6 p-12">
  <div class="w-full max-w-7xl bg-white p-6">
    <div class="virus mx-auto flex max-w-5xl flex-row items-stretch justify-between">
      <div class=" w-full max-w-8 shrink-0 grow-0 rounded bg-[#242221]"></div>
      <div class="my-2 flex-1 bg-gradient-to-b from-[#484649] to-[#2C2A24] px-4 py-3">
        <!-- Top bar -->
        <div class="flex flex-row justify-between">
          <div class="flex flex-row items-center justify-between gap-6">
            <img src="/assets/access.svg" alt="Access Music" class="block h-6" />
            <div class="mr-auto">
              <span class="label text-xl font-bold leading-none tracking-wide">VIRUS C</span>
            </div>
          </div>
          <div class="flex flex-row items-start gap-4 text-[10px] font-semibold leading-none tracking-tighter">
            <div class="flex flex-row items-center justify-between gap-3">
              <div>MIDI THRU</div>
              <div>MIDI OUT</div>
              <div>MIDI IN</div>
            </div>
            <div class="flex flex-col items-center justify-start">
              <div class="flex w-full flex-row items-start justify-between gap-3">
                <div>L / PHONES</div>
                <div>R / MONO</div>
              </div>
              <div class="w-full border-t border-white" />
              <div>OUT 1</div>
            </div>
            <div class="flex w-14 flex-col items-center justify-start">
              <div class="flex w-full flex-row items-start justify-between gap-3">
                <div>L</div>
                <div>R</div>
              </div>
              <div class="w-full border-t border-white" />
              <div>OUT 2</div>
            </div>
            <div class="flex w-14 flex-col items-center justify-start">
              <div class="flex w-full flex-row items-start justify-between gap-3">
                <div>L</div>
                <div>R</div>
              </div>
              <div class="w-full border-t border-white" />
              <div>OUT 3</div>
            </div>
            <div class="flex w-14 flex-col items-center justify-start">
              <div class="flex w-full flex-row items-start justify-between gap-3">
                <div>L</div>
                <div>R</div>
              </div>
              <div class="w-full border-t border-white" />
              <div>EXT IN</div>
            </div>

            <span>12V DC</span>
            <span>ON/OFF</span>
          </div>
        </div>

        <!-- Main controls -->
        <div class="my-3 flex w-full flex-row items-stretch gap-2">
          <div class="mr-auto flex w-full flex-col gap-2">
            <div class="flex h-full w-full flex-1 flex-row gap-2 bg-orange-700">
              <div class="flex w-full max-w-16 flex-col justify-end gap-2 bg-gray-500">
                <div class="flex-1">Vol</div>
                <div class="flex-1">
                  <section class="border-l-4 border-t-2 border-blue-400 bg-zinc-800 text-xs">
                    <div class="inline-block bg-green-900">ARP</div>

                    <div class="flex flex-row items-end justify-center gap-0.5">
                      <div class="flex flex-col items-center gap-1">
                        <LED on="true" />
                        <button
                          class="block size-6 rounded-sm border-0 bg-gradient-to-b from-[#5B5A72] via-[#686685] via-80% to-[#9796AF] shadow outline-1 ring-1 ring-inset ring-black/80 ring-offset-0"
                        >
                        </button>
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">EDIT</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED on="true" />
                        <button
                          class="block size-6 rounded-sm border-0 bg-gradient-to-b from-[#5B5A72] via-[#686685] via-80% to-[#9796AF] shadow outline-1 ring-1 ring-inset ring-black/80 ring-offset-0"
                        >
                        </button>
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">ARP ON</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
              <div class="w-full bg-gray-500">LFOS/MOD</div>
              <div class="w-full bg-gray-500">OSCILLATORS</div>
            </div>
            <div class="flex h-full w-full flex-1 flex-row gap-2 bg-blue-600">
              <div class="w-full bg-gray-500">EFFECTS</div>
              <div class="w-full bg-gray-500">
                <div>BUTTON AREA AND SCREEN</div>

                <div class="p-2">
                  <LCD line1="MidiChannel" line2="ch 2 - and some - other - things" />
                </div>
              </div>
            </div>
          </div>

          <section class="border-l-4 border-t-2 border-blue-400 bg-zinc-800 text-xs">
            <div class="inline-block bg-green-900">MIX</div>
            <div class="flex flex-col gap-1 text-xs">
              {#each ["OSC BAL", "SUB OSC", "OSC VOL", "NOISE", "RING MOD"] as label}
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">{label}</span>
                </div>
              {/each}
            </div>
          </section>

          <div class="flex flex-col gap-2 text-xs">
            <section class="h-full border-l-4 border-t-2 border-blue-400 bg-zinc-800">
              <div class="inline-block bg-green-900">FILTERS</div>
              <div class="grid w-full grid-cols-4 gap-3">
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">CUTOFF</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">RESONANCE</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">ENV AMOUNT</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">FILTER BALANCE</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Cutoff 2</span>
                </div>
                <div class="col-span-3"></div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Attack</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Decay</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Sustain</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Release</span>
                </div>
              </div>
            </section>

            <section class="h-full border-l-4 border-t-2 border-blue-400 bg-zinc-800">
              <div class="inline-block bg-green-900">AMPLIFIER</div>
              <div class="grid w-full grid-cols-4 gap-3">
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Attack</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Decay</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Sustain</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <div class="block size-8 rounded-full bg-slate-500"></div>
                  <span class="label whitespace-nowrap text-[8px] tracking-tighter">Release</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Bottom line -->
        <div class="flex flex-row items-center justify-end">
          <div class="text-[10px] font-medium tracking-tighter">ADVANCED SIMULATED ANALOG SYNTHESIZER</div>
        </div>
      </div>
      <div class=" w-full max-w-8 shrink-0 grow-0 rounded bg-[#242221]"></div>
    </div>
  </div>

  <div class="mx-auto w-full max-w-3xl">
    <div class="panel relative max-w-60">
      <div class="panel-cutout inline-block bg-gray-800">
        <div class="panel-cutout-label text-white">LFOS/MOD</div>
      </div>

      <div class="panel-content">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi aperiam consequatur, distinctio dolorem
      </div>
    </div>
  </div>

  <div
    class="relative overflow-hidden rounded-lg border border-gray-600 bg-gradient-to-b from-gray-700 to-gray-800 p-8 shadow-lg"
  >
    <!-- Gritty texture overlay -->
    <div class="gritty-overlay absolute inset-0 opacity-100"></div>
  </div>

  <img src="/assets/references/virus-c-hq.webp" alt="Access Virus C - Reference Image" class="w-full max-w-7xl" />
</main>

<style>
  @import url("https://fonts.cdnfonts.com/css/handelgothic-bt");

  :root {
    --var-light: #f1f1f2;
    --var-black: #231f20;
    --var-gray: #bec3c9;

    --var-bg: #48465e;
    --var-bg-alt: #3b4154;
    --var-surface: #292835;
    --var-surface-alt: #2c2a23;
    --var-blue: #6584c1;
    --var-button: #5c5b75;
    --var-red: #b7112e;
    --var-red-alt: #9b1027;
  }

  .virus {
    font-family: "Pathway Extreme", "Helvetica Neue", "Helvetica", sans-serif;
    color: var(--var-light);
  }

  .label {
    font-family: "HandelGothic BT", "HandelGothic", sans-serif;
  }

  .panel {
    --border-width: 4px;
    --cutout-size: 18px;
  }

  .panel-content {
    background-color: #33313f;
    border-color: #6880c6;
    border-top-width: calc(var(--border-width) * 0.5);
    border-left-width: var(--border-width);
  }

  .panel-cutout {
    overflow: hidden;
    top: calc(var(--cutout-size) * -0.99);
    position: absolute;
    clip-path: polygon(
      0 0,
      /* Top-left corner */ calc(100% - var(--cutout-size) - calc(var(--border-width) * 0.5)) 0,
      /* Top-right before cutout */ 100% var(--cutout-size),
      /* Point of cutout at top-right */ 100% 100%,
      /* Bottom-right corner */ 0 100% /* Bottom-left corner */
    );
    background-color: red;
    border-left: calc(var(--border-width) * 0.5) solid #6880c6; /*margin-bottom: calc(var(--border-width) * -1);*/
  }

  .panel-cutout::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #33313f;

    /* @formatter:off */
    /* prettier-ignore */
    clip-path: polygon(
        /* Slightly inset from top-left corner to create border effect */
        calc(var(--border-width) * 0.5) calc(var(--border-width) * 0.25),

        /* Top-right before cutout (inset by border width) */
        calc(100% - var(--cutout-size) - var(--border-width)) calc(var(--border-width) * 0.25),

        /* Point of cutout at top-right (inset by border width) */
        calc(100% - var(--border-width) * 0.25) calc(var(--cutout-size) + var(--border-width) * 0.5),

        /* Bottom-right corner (inset by border width) */
        calc(100% - var(--border-width) * 0.25) 100%,

        /* Bottom-left corner (inset by border width) */
        calc(var(--border-width) * 0.5) calc(100% ),

        /* Close path by returning to starting point */
        calc(var(--border-width) * 0.5) calc(var(--border-width) * 0.25)
      );
    /* prettier-ignore-end */
    /* @formatter:on */
  }

  .panel-cutout-label {
    position: relative;
    z-index: 10;
    padding-left: calc(var(--border-width));
    padding-right: calc(var(--border-width) + var(--cutout-size));
    margin-bottom: calc(var(--cutout-size) * -0.2);
  }

  .gritty-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
</style>

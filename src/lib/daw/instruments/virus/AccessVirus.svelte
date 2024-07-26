<script>
  import LED from "../../../ui/LED.svelte";
  import LCD from "../../../ui/LCD.svelte";
  import Panel from "./Panel.svelte";
  import VirusButton from "./VirusButton.svelte";
  import VirusKnob from "./VirusKnob.svelte";
  import Seperator from "./Seperator.svelte";
</script>

<main class="flex h-full w-full flex-col items-center justify-center gap-6 p-12">
  <section class=" max-w-screen-2xl bg-white p-12">
    <div class="virus mx-auto inline-flex max-w-7xl flex-row items-stretch justify-between">
      <div class="virus-side max-w-8 shrink-0 grow-0 rounded"></div>
      <div class="virus-panel my-2 flex-1 px-4 py-3">
        <!-- Top bar -->
        <div class="flex flex-row justify-between">
          <div class="flex flex-row items-center justify-between gap-6">
            <img src="/assets/access.svg" alt="Access Music" class="block h-6" />
            <div class="mr-auto">
              <span class=" font-mono text-2xl font-bold leading-none tracking-tighter">VIRUS C</span>
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
        <div class="my-3 flex gap-2">
          <div class="flex flex-col gap-2">
            <div class="flex h-full w-full flex-row justify-start gap-2">
              <div class="flex w-full max-w-20 flex-col justify-end gap-2">
                <div class="flex flex-1 flex-col items-center justify-center gap-1 p-2">
                  <VirusKnob />
                  <div class="inline-block text-center text-[10px] font-medium leading-none tracking-tighter">
                    Master Volume
                  </div>
                </div>
                <div class="flex-1">
                  <Panel class="h-full" label="ARP">
                    <div class="flex flex-row items-end justify-center gap-0.5">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">EDIT</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">ARP ON</span>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>

              <Panel class="h-full" label="LFOS/MOD">
                <div class="flex flex-col gap-2">
                  <div class="flex flex-row gap-2">
                    <div class="flex flex-row items-end justify-center gap-0.5">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">EDIT</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">SELECT</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-row gap-2">
                    <div>
                      <VirusButton />
                      <span class="label text-center">SELECT</span>
                    </div>

                    <Seperator label="1" />

                    <div>
                      {#each ["OSC 1", "OSC 2", "PW 1+2", "RESO 1+2", "FILT GAIN", "ASSIGN"] as label}
                        <div class="flex flex-row items-center justify-start gap-1">
                          <LED size="8" on="true" />
                          <span class="label">{label}</span>
                        </div>
                      {/each}
                    </div>

                    <Seperator label="2" />

                    <div>
                      {#each ["FILT 1", "FILT 2", "SHAPE 1+2", "FM AMT", "PAN", "ASSIGN"] as label}
                        <div class="flex flex-row items-center justify-start gap-1">
                          <LED size="8" on="true" />
                          <span class="label">{label}</span>
                        </div>
                      {/each}
                    </div>
                    <Seperator label="3" />

                    <div>
                      {#each ["OSC 1", "OSC 2", "PW 1", "PW 2", "SYNC PHASE"] as label}
                        <div class="flex flex-row items-center justify-start gap-1">
                          <LED size="8" on="true" />
                          <span class="label">{label}</span>
                        </div>
                      {/each}
                    </div>
                    <Seperator label="MOD" />

                    <div>
                      {#each ["ASSIGN 1", "ASSIGN 2", "ASSIGN 3", "ASSIGN 4", "ASSIGN 5", "ASSIGN 6"] as label}
                        <div class="flex flex-row items-center justify-start gap-1">
                          <LED size="8" on="true" />
                          <span class="label">{label}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel class="h-full" label="OSCILLATORS">
                <div class="grid grid-cols-4 gap-1">
                  <div class="flex flex-col items-center justify-center">
                    <VirusKnob />
                    <span class="label mt-1">Shape</span>
                  </div>
                  <div class="flex flex-col items-center justify-center">
                    <VirusKnob />
                    <span class="label mt-1">WAVE SEL/PW</span>
                  </div>
                  <div class="flex flex-col items-center justify-center">
                    <VirusKnob />
                    <span class="label mt-1">SEMITONE</span>
                  </div>
                  <div class="flex flex-col items-center justify-center">
                    <VirusKnob />
                    <span class="label mt-1">DETUNE 2/3</span>
                  </div>

                  <div>
                    <div class="flex flex-row items-center gap-0.5">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">EDIT</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">SYNC</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-center justify-center">
                    <VirusKnob />
                    <span class="label mt-1">FM AMOUNT</span>
                  </div>

                  <div class="col-span-2 flex flex-row items-center justify-end gap-0.5">
                    <div class="flex flex-col items-center gap-1">
                      <LED size="8" on="true" />
                      <VirusButton />
                      <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">&nbsp;</span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <LED size="8" on="true" />
                      <VirusButton />
                      <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">SELECT</span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <LED size="8" on="true" />
                      <VirusButton />
                      <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">&nbsp;</span>
                    </div>
                    <div class="px-2"></div>
                    <div class="flex flex-col items-center gap-1">
                      <LED size="8" on="true" />
                      <VirusButton />
                      <span class="label whitespace-nowrap text-[8px] font-semibold tracking-tighter">OSC 3 ON</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
            <div class="flex h-full flex-row gap-2">
              <Panel class="h-full" label="EFFECTS">
                <div class="grid grid-cols-4 gap-1">
                  <div class="col-span-2 flex flex-row items-end justify-start gap-0.5">
                    <div class="flex flex-col items-center gap-1">
                      <LED size="8" on="true" />
                      <VirusButton />
                      <span class="label">EDIT <br />&nbsp;</span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <VirusButton />
                      <span class="label">SELECT <br />&nbsp;</span>
                    </div>
                  </div>

                  <div class="flex flex-col items-center justify-end">
                    <VirusKnob />
                    <span class="label mt-1 text-center">TYPE/ <br />MIX</span>
                  </div>
                  <div class="flex flex-col items-center justify-end">
                    <VirusKnob />
                    <span class="label mt-1">INTENSITY <br />&nbsp;</span>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-1">
                  <div class="col-span-full mb-1 mt-2 block">DELAY / REVERB</div>
                  <div class="flex flex-col items-center justify-center">
                    <div class="flex flex-row items-end justify-center gap-0.5">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label mt-1">EDIT <br />&nbsp;</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-center justify-end">
                    <VirusKnob />
                    <span class="label mt-1">SEND <br />&nbsp;</span>
                  </div>
                  <div class="flex flex-col items-center justify-end">
                    <VirusKnob />
                    <span class="label mt-1">DELAY / <br />REV TIME</span>
                  </div>
                  <div class="flex flex-col items-center justify-end">
                    <VirusKnob />
                    <span class="label mt-1">FEEDBACK / <br /> DAMPING</span>
                  </div>
                </div>
              </Panel>
              <div class="w-full">
                <div class="flex h-full w-full items-center justify-center bg-black p-2">
                  <div class="max-w-60">
                    <LCD
                      lines={["Midi Channel", "ch 2 - and some - other - things"]}
                      speed={100}
                      delay={false}
                      columns={18}
                      rows={2}
                    />
                  </div>

                  <div class="ml-auto flex flex-col gap-2">
                    <div class="flex flex-col items-center justify-center gap-1">
                      <div class="ml-auto flex flex-row items-end justify-center gap-0.5">
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                      </div>

                      <div class="flex flex-col items-center">
                        <span class="label">PART</span>
                        <span class="label !text-[6px]">DEMO</span>
                      </div>
                    </div>

                    <div class="flex flex-col items-center justify-center gap-1">
                      <div class="ml-auto flex flex-row items-end justify-center gap-0.5">
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                      </div>
                      <div class="flex flex-col items-center">
                        <span class="label leading-none">PARAMETER</span>
                        <span class="label !text-[6px] leading-none">BANK</span>
                      </div>
                    </div>

                    <div class="flex flex-col items-center justify-center gap-1">
                      <div class="ml-auto flex flex-row items-end justify-center gap-0.5">
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                        <div class="flex flex-col items-center gap-1">
                          <VirusButton />
                        </div>
                      </div>

                      <div class="flex flex-col items-center">
                        <span class="label leading-none">VALUE</span>
                        <span class="label !text-[6px] leading-none">PROGRAM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Panel label="MIX">
            <div class="flex flex-col gap-1 text-xs">
              {#each ["OSC BAL", "SUB OSC", "OSC VOL", "NOISE", "RING MOD"] as label}
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">{label}</span>
                </div>
              {/each}
            </div>
          </Panel>

          <div class="flex flex-col gap-2 text-xs">
            <Panel class="h-full" label="FILTERS">
              <div class="grid w-full grid-cols-4 gap-3">
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">CUTOFF</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">RESONANCE</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">ENV AMOUNT</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">FILTER BALANCE</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Cutoff 2</span>
                </div>
                <div class="col-span-3 p-2">
                  <div class="flex flex-row items-end justify-center gap-1">
                    <div class="flex flex-row">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label">EDIT</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label">FILT 1</span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <div class="flex flex-row items-center justify-center gap-1">
                        <LED size="8" on="true" />
                        <span class="label text-[8px]">LP</span>
                        <LED size="8" on="true" />
                      </div>
                      <div class="flex flex-row items-center justify-center gap-1">
                        <LED size="8" on="true" />
                        <span class="label text-[8px]">HP</span>
                        <LED size="8" on="true" />
                      </div>
                      <div class="flex flex-row items-center justify-center gap-1">
                        <LED size="8" on="true" />
                        <span class="label text-[8px]">BP</span>
                        <LED size="8" on="true" />
                      </div>
                      <div class="flex flex-row items-center justify-center gap-1">
                        <LED size="8" on="true" />
                        <span class="label text-[8px]">BS</span>
                        <LED size="8" on="true" />
                      </div>
                    </div>

                    <div class="flex flex-row">
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                        <span class="label">FILT 2</span>
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                      </div>
                      <div class="flex flex-col items-center gap-1">
                        <LED size="8" on="true" />
                        <VirusButton />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Attack</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Decay</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Sustain</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Release</span>
                </div>
              </div>
            </Panel>

            <Panel class="h-full" label="AMPLIFIER">
              <div class="grid w-full grid-cols-4 gap-3">
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Attack</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Decay</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Sustain</span>
                </div>
                <div class="flex flex-col items-center justify-center">
                  <VirusKnob />
                  <span class="label mt-1">Release</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <!-- Bottom line -->
        <div class="flex flex-row items-center justify-end">
          <div class="label">ADVANCED SIMULATED ANALOG SYNTHESIZER</div>
        </div>
      </div>
      <div class="virus-side w-full max-w-8 shrink-0 grow-0 rounded"></div>
    </div>
  </section>

  <img
    src="/assets/references/virus-c-hq.webp"
    alt="Access Virus C - Reference Image"
    class="w-full max-w-screen-2xl"
  />
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

  .virus-side {
    @apply bg-[#242221];
  }

  .virus-panel {
    position: relative;
    background: linear-gradient(180deg, #2e3030, #303032);
    box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.3);
  }

  .label {
    font-family: "HandelGothic", sans-serif;
    @apply whitespace-nowrap text-[9px] uppercase tracking-tighter;
  }

  .gritty-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
</style>

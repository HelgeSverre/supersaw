<tmeplate>
  <div
    class="lcd-panel relative w-full overflow-hidden rounded-sm bg-gray-900 p-1 shadow-inner shadow-slate-200/10 ring-1 ring-black/20"
  >
    <div class="lcd-panel-screen relative rounded-sm bg-black p-2 shadow-lg shadow-red-100/10">
      <!-- LCD Display -->
      <div class="pulsate lcd-grid relative z-10 text-sm text-red-600">
        <!-- First row -->
        <div class="lcd-character">1</div>
        <div class="lcd-character"></div>
        <div class="lcd-character">V</div>
        <div class="lcd-character">O</div>
        <div class="lcd-character">C</div>
        <div class="lcd-character">O</div>
        <div class="lcd-character">D</div>
        <div class="lcd-character">E</div>
        <div class="lcd-character">R</div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <!-- Second row -->
        <div class="lcd-character">M</div>
        <div class="lcd-character">o</div>
        <div class="lcd-character">d</div>
        <div class="lcd-character">e</div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character"></div>
        <div class="lcd-character">o</div>
        <div class="lcd-character">f</div>
        <div class="lcd-character">f</div>
        <div class="lcd-character"></div>
      </div>
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-red-800 opacity-10 blur-sm"></div>
      <!-- Inset shadow effect -->
      <div class="absolute inset-0 shadow-inner shadow-black/50"></div>
      <!-- Smudgy overlay -->
      <div class="smudgy-overlay absolute inset-0"></div>
    </div>
  </div>
</tmeplate>

<style>
  @keyframes pulsate {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.92;
    }
  }

  .pulsate {
    animation: pulsate 84ms ease-in-out infinite;
  }

  .lcd-grid::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="2.5" height="2.5"><rect width="1" height="1" fill="FFC599" opacity="0.9"/></svg>');
    background-color: rgba(144, 0, 4, 0.3);
    opacity: 0.1;
    pointer-events: none;
  }

  .lcd-grid {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 2px;
  }

  .lcd-character {
    font-family: "Pathway Extreme", "Helvetica Neue", "Helvetica", sans-serif;
    aspect-ratio: 1 / 1.3;
    background-color: rgba(80, 0, 0, 0.45);
    text-shadow:
      0 0 1px rgba(200, 0, 0, 0.1),
      0 0 4px rgba(180, 0, 0, 0.15),
      0 0 5px rgba(180, 0, 0, 0.25),
      0 0 6px rgba(180, 0, 0, 0.25),
      0 0 7px rgba(255, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }

  .smudgy-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.1'  numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E");
    background-color: rgba(185, 0, 20);
    background-size: cover;
    background-repeat: no-repeat;
    filter: saturate(1.1) blur(3px) opacity(0.3) brightness(0.3);
  }
</style>

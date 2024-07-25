<div class="knob">
  <div class="knob-center"></div>
</div>

<style>
    .knob {
        --knob-color: #5e5c5d;
        --knob-color-border: #575556;
        --knob-size: 1.5rem;
    }

    .knob {
        position: relative;
        width: var(--knob-size);
        height: var(--knob-size);
        display: flex;
        justify-content: center;
        background-color: var(--knob-color);
        border-radius: 100%;
    }

    .knob-center {
        width: var(--knob-size);
        height: var(--knob-size);
        border-radius: 100%;
        position: relative;
        transform: rotate(-45deg);
        transition: all 0.1s ease;
        z-index: 2;
    }

    .knob-center:before {
        content: "";
        height: calc(50% + 1px);
        width: 3px;
        display: block;
        position: absolute;
        top: -0.5px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 3px;
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        background-color: white;
        z-index: 2;
    }

    .knob-center:after {
        content: "";
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: transparent;
        border-radius: 100%;
        box-shadow: inset 1px 1px 2px rgb(178, 178, 178, 0.4);
        transition: all 0.1s ease;
    }
</style>

<script lang="ts">
  export let controls;

  const entries: any = Object.entries($controls);

  const isNotEmpty = entries.length > 0;

  const is = {
    number: (value: any) => typeof value === "number",
    boolean: (value: any) => typeof value === "boolean",
    text: (value: any) => typeof value === "string" && !value.startsWith("#"),
    color: (value: any) => typeof value === "string" && value.startsWith("#"),
    range: (value: any) => typeof value === "object" && value.step, // && param
  };

  function updateControls(e: Event) {
    let { value, type, dataset, checked, step, min, max } =
      e.target as HTMLInputElement;
    let key = dataset.key!;

    switch (type) {
      case "range":
        if (e.type === "wheel") {
          let direction = (e as WheelEvent).deltaY < 0 ? "up" : "down";
          if (direction === "up") {
            $controls[key].value < max && ($controls[key].value += +step);
          } else {
            $controls[key].value > min && ($controls[key].value -= +step);
          }
        } else {
          $controls[key].value = +value;
        }
        break;

      case "checkbox":
        $controls[key] = checked;
        break;

      case "number":
        $controls[key] = +value;
        break;

      default:
        $controls[key] = value;
    }
  }
</script>

{#if isNotEmpty}
  <div class="sidebar">
    <h3 class="heading">Controls</h3>

    {#each entries as [label, value]}
      {#if is.range(value)}
        <label>
          {label}
          <input
            id="sidebar_range"
            on:input={updateControls}
            on:wheel={updateControls}
            data-key={label}
            value={$controls[label].value}
            min={$controls[label].min}
            max={$controls[label].max}
            step={$controls[label].step}
            type="range"
          />
          <div class="readout">
            {Number($controls[label].value).toFixed(2)}
          </div>
          <div
            id="sidebar_range_lock"
            data-key={"lock_" + label}
            class="col-start-5 col-span-1 text-xs my-1 text-green-500"
          ></div>
        </label>
      {/if}

      {#if is.text(value)}
        <label>
          {label}
          <input
            on:input={updateControls}
            checked={$controls[label]}
            data-key={label}
            type="text"
          />
        </label>
      {/if}

      {#if is.color(value)}
        <label>
          {label}
          <input
            on:input={updateControls}
            value={$controls[label]}
            data-key={label}
            type="color"
          />
        </label>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .sidebar {
    position: absolute;
    background-color: var(--sidebar-background-color, #222);
    top: var(--sidebar-position-top, 10px);
    right: var(--sidebar-position-right, 10px);
    left: var(--sidebar-position-left);
    bottom: var(--sidebar-position-bottom);
    display: grid;
    gap: 0.75rem;
    padding: 0.5rem;
    border: 1px solid;
    border-radius: 8px;
    border-color: hsl(0 0% 0% / 20%);
    box-shadow: 1px 1px 10px hsl(0 0% 0% / 10%);
  }

  .sidebar label {
    display: grid;
    grid-template-columns: repeat(1, 1fr 2fr 1fr 1fr);
    gap: 0.25rem;
    align-items: center;
    justify-items: end;
    font-weight: 600;
  }

  .sidebar input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 8rem;
    grid-column-start: 2;
    grid-column-end: 4;
    height: 20px;
    cursor: pointer;
    text-align: center;
  }

  .sidebar input[type="range"]::-webkit-slider-runnable-track {
    width: 300px;
    height: 5px;
    background: #594e4e;
    border: none;
    border-radius: 3px;
  }

  .sidebar input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: none;
    height: 12px;
    width: 6px;
    background: var(--slider-thumb-color);
    margin-top: -4px;
  }

  .sidebar input[type="range"]:focus {
    outline: none;
  }

  .sidebar input[type="range"]:focus::-webkit-slider-runnable-track {
    background-color: var(--slider-thumb-color);
  }

  .sidebar .readout {
    font-size: 0.75rem;
    color: slategray;
  }

  .sidebar .heading {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--sidebar-heading-color, #fff);
    text-align: left;
    margin-bottom: 0.1rem;
    margin-top: 0.5rem;
  }
</style>
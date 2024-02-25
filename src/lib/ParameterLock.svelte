<script lang="ts">
  import { onMount } from "svelte";
  import { LockIcon, createLockFSM, LocksStore } from "../stores/stores";
  import type { FSM } from "../stores/stores";
  import { get } from "svelte/store";

  let lockButtons: Element[] = [];
  let paramLocksAsMap: Map<Element, FSM> = new Map();
  let lockFSM: FSM;
  onMount(() => {
    getLockButtons();
    setupLockButtonsOnSidebar();
  });

  function getLockButtons() {
    lockButtons = Array.from(document.querySelectorAll("#sidebar_range_lock"));
  }

  function setupLockButtonsOnSidebar() {
    lockButtons.map((lockElement) => {
      lockElement.addEventListener("pointerdown", lockParam);
      (lockElement as HTMLElement).style.cursor = "pointer";
      lockElement.textContent = $LockIcon.OPEN;
      paramLocksAsMap.set(lockElement, createLockFSM());
    });
  }

  function lockParam(event: any) {
    //console.log(event.target as Element);
    const name = event.target.dataset.key.split("_")[1];
    const iconDiv = event.target;

    // toggle the FSM linked to the Label/Button (see Map definition)
    if (name && iconDiv) {
      const lock = event.target as Element;
      lockFSM = paramLocksAsMap.get(lock as Element) as FSM;
      iconDiv.textContent = lockFSM.toggle();
    }
    // 2. Derive a labelled version of the same as a plain Object
    // which is also existing a Svelte writable
    const parsedLock: { [k: string]: 0 | 1 } = {
      [name]: iconDiv.textContent === $LockIcon.OPEN ? 0 : 1,
    };
    const prevLocksStore = get(LocksStore);
    LocksStore.set({ ...prevLocksStore, ...parsedLock });
  }
</script>

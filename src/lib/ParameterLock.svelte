<script lang="ts">

/**
 * Parameter Locks
 * Coder entertaining themselves, unnecessarily tricky.
 * The actual HTML Element (the lock button div) is 
 * stored as Key in Map, and its related state machine as value. Because Maps allow for polymorphic keys.
 * Also a simple boolean representation is pushed to the Map, with more conventional 'string' as key 
 * and bool as value, after interactions have happened.
 * Pretty cool yet over complicated use of polymorphic keys. 
 **/


  import { onMount } from "svelte";
  import { LockIcon, createLockFSM, LocksMap } from "../stores/stores";
  import type { FSM } from "../stores/stores";

  let lockButtons: Element[] = [];
  let lockFSM: FSM;
  onMount(() => {
    getLockButtons();
    setupLockButtonsOnSidebar();
  });

  function getLockButtons() {
    lockButtons = Array.from(document.querySelectorAll("#sidebar_range_lock"));
  }

  function setupLockButtonsOnSidebar() {
    lockButtons.map((lockElement, i) => {
      lockElement.addEventListener("pointerdown", lockParam);
      (lockElement as HTMLElement).style.cursor = "pointer";
      lockElement.textContent = $LockIcon.OPEN;
      $LocksMap.set(lockElement, createLockFSM());
    });
  }

  function lockParam(event: any) {
    //console.log(event.target as Element);
    const name = event.target.dataset.key.split("_")[1];
    const button = event.target;

    // toggle the FSM linked to the Label/Button (see Map definition)
    // and add a simple bool rep keyed with paramID to the LocksMap in the store

      const lock = event.target as HTMLInputElement;
      const linkedParam =  (lock.dataset.key?.split('_')[1]) as string; // need to format a bit, comes in via the data-key prop on the HTML Element
      lockFSM = $LocksMap.get(lock) as FSM;
      //@ts-ignore
      button.textContent = lockFSM.toggle();
      $LocksMap.set( linkedParam, $lockFSM === $LockIcon.LOCKED  )
      $LocksMap = $LocksMap
  }

</script>

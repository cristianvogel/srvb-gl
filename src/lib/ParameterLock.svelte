<script lang="ts">
  import { onMount, setContext } from "svelte";
  import {
    CablesPatch,
    LockIcon,
    ParamIds,
    createLockFSM,
    LocksStore,
  } from "../stores/stores";
  import type { FSM } from "../stores/stores";
  import { get } from "svelte/store";

  let lockButtons: Element[] = [];
  let paramLocksAsMap: Map<Element, FSM> = new Map();

  onMount(() => {
    getLockIcons();
    addLockButtonsToSidebar();
  });

  function getLockIcons() {
    lockButtons = Array.from(
      document.getElementsByClassName("sidebar__item-label")
    ).filter(paramsLabelOnly);
  }

  function paramsLabelOnly(el: Element) {
    return $ParamIds.includes(el.textContent?.toLowerCase() || "");
  }

  function addLockButtonsToSidebar() {
    lockButtons.map((el) => {
      el.addEventListener("pointerdown", lockParam);
      (el as HTMLElement).style.cursor = "pointer";
      const lock = document.createElement("div");
      lock.style.fontSize = "0.8em";
      lock.style.margin = "6px 0 6px 0";
      lock.style.color = "aqua";
      lock.textContent = $LockIcon.OPEN;
      lock.id = "lock-" + el.parentElement?.textContent?.toLowerCase();
      el.appendChild(lock);
      paramLocksAsMap.set(lock, createLockFSM());
    });
  }

  // subscribe to each lock toggle state machine
  // reactive watcher on UI locks
  $: {
    for (const [lockId, lockFSM] of paramLocksAsMap) {
      lockId.textContent = lockFSM as FSM as unknown as string;
    }
  }

  function lockParam(event: any) {
    //console.log(event.target as Element);
    const name = event.target.id.split("-")[1];
    const iconDiv = event.target;

    // toggle the FSM linked to the Label/Button (see Map definition)
    if (name && iconDiv) {
      console.log("Locking parameter: ", name);
      const lock = event.target.parentElement?.querySelector("div");
      const lockFSM: FSM = paramLocksAsMap.get(lock as Element) as FSM;
      //@ts-ignore
      iconDiv.textContent = lockFSM.toggle();
    }

    // update the Cables patch with the new lock state
    // parameterLock() is a function that exists in the Cables patch only
    // triggers an update involving the variables ui_parameterLocks which is an array,
    // and ui_parameterLocksObject which is
    //  Key: paramsID ,
    // Value: (0 | 1)
    // exists only as am object in the Cables patch
    //
    // first some shenanigans to get the values of the locks
    //
    // 1. Derive an array version used in Cables patch.
    const locksArray = Array.from(paramLocksAsMap.keys()).map((el) => {
      // @ts-ignore
      return el.textContent === $LockIcon.OPEN ? 0 : 1;
    });

    $CablesPatch.setVariable("ui_parameterLocks", locksArray);

    // 2. Derive a labelled version of the same as a plain Object
    // which is also existing a Svelte writable
    const parsedLock: { [k: string]: 0 | 1 } = {
      [name]: iconDiv.textContent === $LockIcon.OPEN ? 0 : 1,
    };
    const prevLocksStore = get(LocksStore);
    LocksStore.set({ ...prevLocksStore, ...parsedLock });

    try {
      $CablesPatch.setVariable("ui_parameterLocksObject", parsedLock);
      // then call a Patch function to update things
      $CablesPatch.config.parameterLock();
    } catch (error) {
      console.warn(error);
    }
  }
</script>

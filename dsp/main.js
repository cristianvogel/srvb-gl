import {Renderer, el} from '@elemaudio/core';
import {RefMap} from './RefMap';
import srvb from './srvb';

// folding algorithm from thi.ng lib
const foldback = (e, x) =>
	x < -e || x > e ? Math.abs(Math.abs((x - e) % (4 * e)) - 2 * e) - e : x;
let nodeValueNumber = 0;

// const patch = globalThis.CABLES.patch


// This project demonstrates writing a small FDN reverb effect in Elementary.
//
// First, we initialize a custom Renderer instance that marshals our instruction
// batches through the __postNativeMessage__ function to direct the underlying native
// engine.
let core = new Renderer((batch) => {
  __postNativeMessage__(JSON.stringify(batch));
});

// core.on('meter', function(e) {
//   if (e.source === 'el_meter') {
//     patch.setVariable('el_meter', e.max);
//   }
// });

// Next, a RefMap for coordinating our refs
let refs = new RefMap(core);

// Holding onto the previous state allows us a quick way to differentiate
// when we need to fully re-render versus when we can just update refs
let prevState = null;

function shouldRender(prevState, nextState) {
  return (prevState === null) || (prevState.sampleRate !== nextState.sampleRate);
}

// The important piece: here we register a state change callback with the native
// side. This callback will be hit with the current processor state any time that
// state changes.
//
// Given the new state, we simply update our refs or perform a full render depending
// on the result of our `shouldRender` check.
globalThis.__receiveStateChange__ = (serializedState) => {
  const state = JSON.parse(serializedState);

  const foldedModulationValue = ( a = state.circleID, b = state.mod) => foldback(a, b);

  if (shouldRender(prevState, state)) {
    let stats = core.render(...srvb({
      key: 'srvb',
      sampleRate: state.sampleRate,
      size: refs.getOrCreate('size', 'const', {value: state.size}, []),
      decay: refs.getOrCreate('decay', 'const', {value: state.decay}, []),
      mix: refs.getOrCreate('mix', 'const', {value: state.mix}, []),
      circleID: refs.getOrCreate('circleID', 'const', {key: 'circle-'+state.circleID, value:  foldedModulationValue() || 0.1}, []),
      nodeValue: refs.getOrCreate('nodeValue', 'const', {value: state.nodeValue || 0.1}, []),
      mod: refs.getOrCreate('mod', 'const', {value: state.mod }, []),
    }, el.in({channel: 0}), el.in({channel: 1})));

    console.log(stats, meter);
  } else {
    console.log('Updating refs');
    refs.update('size', {value: state.size});
    refs.update('decay', {value: state.decay});
    refs.update('mod', {value: state.mod });
    refs.update('mix', {value: state.mix});
    refs.update('nodeValue', {value: state.nodeValue});
    refs.update('circleID', {key: 'circle-'+state.circleID, value: foldedModulationValue()});
  }

  prevState = state;
};

// NOTE: This is highly experimental and should not yet be relied on
// as a consistent feature.
//
// This hook allows the native side to inject serialized graph state from
// the running elem::Runtime instance so that we can throw away and reinitialize
// the JavaScript engine and then inject necessary state for coordinating with
// the underlying engine.
globalThis.__receiveHydrationData__ = (data) => {
  const payload = JSON.parse(data);
  const nodeMap = core._delegate.nodeMap;

  for (let [k, v] of Object.entries(payload)) {
    nodeMap.set(parseInt(k, 16), {
      symbol: '__ELEM_NODE__',
      kind: '__HYDRATED__',
      hash: parseInt(k, 16),
      props: v,
      generation: {
        current: 0,
      },
    });
  }
};

// Finally, an error callback which just logs back to native
globalThis.__receiveError__ = (err) => {
  console.log(`[Error: ${err.name}] ${err.message}`);
};

//@ts-ignore
//@ts-nocheck

import fsm from 'svelte-fsm';
import { SourceOfChange } from './stores';


export const StateFSM =
    fsm('ready', {
        ready: {
            update(src) {
                if (src === 'ui') return 'updatingUI'
                if (src === 'host') return 'updatingHost'
            }
        },
        updatingHost: {
            _enter() {
                SourceOfChange.set('ui');
                this.set.debounce(1000)
            },
            set: 'ready'
        },
        updatingUI: {
            _enter() {
                SourceOfChange.set('host');
                this.set.debounce(1000)
            },
            set: 'ready'
        }

    })

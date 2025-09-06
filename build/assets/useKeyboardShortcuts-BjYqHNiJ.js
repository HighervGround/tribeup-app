import{c as l,r as a}from"./index-Cc4LGJhl.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]],E=l("phone",d);function k(s,o=!0){const r=a.useCallback(t=>{if(!o)return;const c=t.target;if(!((c.tagName==="INPUT"||c.tagName==="TEXTAREA"||c.contentEditable==="true")&&!["Escape","Enter"].includes(t.key)))for(const e of s){if(e.disabled)continue;const n=e.key.toLowerCase()===t.key.toLowerCase(),i=!!e.ctrlKey===t.ctrlKey,u=!!e.metaKey===t.metaKey,y=!!e.shiftKey===t.shiftKey,f=!!e.altKey===t.altKey;if(n&&i&&u&&y&&f){t.preventDefault(),t.stopPropagation();try{e.action()}catch(h){console.error("Error executing custom shortcut:",h)}break}}},[s,o]);a.useEffect(()=>{if(o)return document.addEventListener("keydown",r),()=>{document.removeEventListener("keydown",r)}},[o,r])}export{E as P,k as u};
//# sourceMappingURL=useKeyboardShortcuts-BjYqHNiJ.js.map

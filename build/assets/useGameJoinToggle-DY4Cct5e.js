import{c as g,t}from"./index-Mzv7St__.js";import{r as c}from"./vendor-Dit9F4CM.js";import{c as d,d as m}from"./useGames-D4AGQlA-.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],v=g("clock",J);function L(){const o=d(),s=m(),a=c.useCallback((e,u)=>{u?.stopPropagation(),console.log("🎯 toggleJoin called with game:",e.id,"isJoined:",e.isJoined),e.isJoined?(console.log("🔄 Attempting to leave game:",e.id),s.mutate(e.id,{onSuccess:()=>{console.log("✅ Leave game success callback"),t.success("Left game successfully")},onError:i=>{console.error("❌ Leave game error callback:",i)}})):(console.log("🔄 Attempting to join game:",e.id),o.mutate(e.id,{onSuccess:()=>{console.log("✅ Join game success callback"),t.success("Joined game successfully!")},onError:i=>{console.error("❌ Join game error callback:",i)}}))},[o,s]),n=o.isPending||s.isPending,l=c.useCallback(e=>n?"...":e.isJoined?"Leave":"Join",[n]),r=c.useCallback(e=>e.isJoined?"outline":"default",[]);return{toggleJoin:a,isLoading:n,getButtonText:l,getButtonVariant:r,isJoining:o.isPending,isLeaving:s.isPending}}export{v as C,L as u};
//# sourceMappingURL=useGameJoinToggle-DY4Cct5e.js.map

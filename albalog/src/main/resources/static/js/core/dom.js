// core/dom.js
// DOM Helper 모음 (querySelector / querySelectorAll 호환)

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// 너 코드에서 쓰던 별칭(qs/qsa)도 같이 제공
export function qs(sel, root = document) {
  return root.querySelector(sel);
}
export function qsa(sel, root = document) {
  return Array.prototype.slice.call(root.querySelectorAll(sel));
}

// (선택) 이벤트 위임이 필요할 때 쓰는 유틸
export function delegate(root, eventName, selector, handler) {
  root.addEventListener(eventName, (e) => {
    const target = e.target.closest(selector);
    if (!target || !root.contains(target)) return;
    handler(e, target);
  });
}

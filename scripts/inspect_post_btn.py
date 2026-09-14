switch_tab('1F732B7B0A409524FCC44157B9DF3C58')

result = js("""
(() => {
  const btn = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
  if (!btn) return { found: false };
  return {
    found: true,
    outerHTML: btn.outerHTML.slice(0, 500),
    innerHTML: btn.innerHTML,
    hasSvg: !!btn.querySelector('svg'),
    svgCount: btn.querySelectorAll('svg').length,
    svgHTML: Array.from(btn.querySelectorAll('svg')).map(s => s.outerHTML),
    text: btn.textContent,
    computed: (() => {
      const s = window.getComputedStyle(btn);
      return {
        width: s.width,
        height: s.height,
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius
      };
    })()
  };
})()
""")

import json
print("POST_BTN_INSPECT_START")
print(json.dumps(result, indent=2))
print("POST_BTN_INSPECT_END")

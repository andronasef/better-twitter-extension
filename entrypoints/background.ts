export default defineBackground(() => {
  if (import.meta.env.DEV) {
    console.log('Hello background!', { id: browser.runtime.id });
  }
});

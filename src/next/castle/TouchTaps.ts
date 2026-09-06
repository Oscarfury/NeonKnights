/** Activate a completed touch tap immediately, including the first tap after a captured drag. */
export function bindTouchTaps(root: HTMLElement) {
  let pressed: { button: HTMLButtonElement; x: number; y: number } | undefined;
  let lastButton: HTMLButtonElement | undefined;
  let lastTime = 0;
  const buttonAt = (e: Event) => (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  const down = (e: PointerEvent) => {
    pressed = undefined;
    const button = buttonAt(e);
    // These controls already handle pointer capture and press/release themselves.
    if (
      e.pointerType !== 'touch' ||
      !button ||
      button.disabled ||
      button.matches('[data-pick], #king-guard, #king-left, #king-right')
    )
      return;
    pressed = { button, x: e.clientX, y: e.clientY };
  };
  const up = (e: PointerEvent) => {
    const tap = pressed;
    pressed = undefined;
    if (!tap || buttonAt(e) !== tap.button || Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8)
      return;
    lastButton = tap.button;
    lastTime = performance.now();
    tap.button.click();
  };
  const cancel = () => {
    pressed = undefined;
  };
  const click = (e: MouseEvent) => {
    if (
      e.isTrusted &&
      e.detail > 0 &&
      (e as PointerEvent).pointerType !== 'mouse' &&
      buttonAt(e) === lastButton &&
      performance.now() - lastTime < 650
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  root.addEventListener('pointerdown', down, true);
  root.addEventListener('pointerup', up, true);
  root.addEventListener('pointercancel', cancel, true);
  root.addEventListener('click', click, true);
  return () => {
    root.removeEventListener('pointerdown', down, true);
    root.removeEventListener('pointerup', up, true);
    root.removeEventListener('pointercancel', cancel, true);
    root.removeEventListener('click', click, true);
  };
}

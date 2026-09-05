import test from 'node:test';
import assert from 'node:assert/strict';
import { InputController } from '../src/game/input/InputController';
import { defaultSettings } from '../src/game/persistence/storage';
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
Object.defineProperty(globalThis, 'document', { value: new EventTarget(), configurable: true });
const controller = () =>
  new InputController(
    new EventTarget() as HTMLCanvasElement,
    defaultSettings(),
    () => {},
    () => {},
  );
test('a complete touch tap between simulation steps is retained exactly once', () => {
  const input = controller();
  input.touch('north', true);
  input.touch('north', false);
  assert.equal(input.read().sector, 0);
  assert.equal(input.read().sector, null);
});
test('held touch actions remain active until release', () => {
  const input = controller();
  input.touch('slow', true);
  assert.equal(input.read().slow, true);
  assert.equal(input.read().slow, true);
  input.touch('slow', false);
  assert.equal(input.read().slow, false);
});
test('focus clearing drops held and pending input', () => {
  const input = controller();
  input.touch('command', true);
  input.touch('alt', true);
  input.clear();
  assert.equal(input.read().command, false);
  assert.equal(input.read().alt, false);
});

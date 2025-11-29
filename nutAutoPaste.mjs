import {
  clipboard,
  keyboard,
  Key,
  sleep,
} from '@nut-tree/nut-js';

const NOTE_TEXT = process.argv.slice(2).join(' ').trim();

if (!NOTE_TEXT) {
  console.error(
    'Usage: npm run auto:paste-note -- \"Final consultation note text here\"',
  );
  process.exit(1);
}

keyboard.config.autoDelayMs = 10;

const pasteIntoActiveField = async (noteText) => {
  try {
    await clipboard.clear();
    await clipboard.setContent(noteText);

    console.log(
      'Switch to your EMR and click into the note field. Pasting in 3 seconds...',
    );
    await sleep(3000);

    await keyboard.pressKey(Key.LeftSuper, Key.V);
    await keyboard.releaseKey(Key.LeftSuper, Key.V);

    console.log('Note pasted into the active EMR field.');
  } catch (error) {
    console.error('nut.js automation failed:', error);
    process.exit(1);
  }
};

await pasteIntoActiveField(NOTE_TEXT);



# Eipfork - async messaging for electron

Eipfork is fork of [Eiphop](https://github.com/krimlabs/eiphop) rewritten in typescript.

---

### Installation

```bash
npm i eipfork
# or
yarn add eipfork
```

### Getting started

Actions are defined in main process and called from renderer with async response.

#### Define actions

Imagine you have the following actions in your `main` process:

```js
const pingActions = {
  ping: (req, res) => {
    const { payload } = req;
    res.send({ msg: 'pong' });
  },
};

const hipActions = {
  hip: async (req, res) => {
    const { payload } = req;
    res.notify('Sleeping for 800ms, BRB');
    // sleep for 800ms
    await new Promise((done) => setTimeout(done, 800));
    res.send({ msg: 'hop' });

    // or res.error({msg: 'failed'})
  },
};
```

#### Setup main handler

Actions from different domain objects need to be combined to one global map and passed to eiphop's `setupMainHandler` function.

```js
import { setupMainHandler } from 'eiphop';
import electron from 'electron';

setupMainHandler({ ...hipActions, ...pingActions });
```

#### Setup Renderer Listener

In your renderer’s index.js file, setup the listener as follows:

```js
import { setupFrontendListener } from 'eiphop';

setupFrontendListener();
```

Now your channels are ready. All you need to do is trigger actions.

#### Emit actions and expect response

Use the `emit` function to call actions defined in the `main` action map.

```js
import { emit } from 'eiphop';

emit('ping', { you: 'can', pass: 'data', to: 'main' }, (msg) => {
  console.log(msg);
})
  .then((res) => console.log(res)) // will log {msg: 'pong'}
  .catch((err) => console.log(err));

emit('hip', { empty: 'payload' }, (msg) => {
  console.log(msg);
})
  .then((res) => console.log(res)) // will log {msg: 'hop'}
  .catch((err) => console.log(err));
```

`emit` takes up to three arguments:

1.  The name of the action to call (this was defined is actions map in `main`)
2.  The payload to send (this can be an object, string, list etc)
3.  [Optional] A callback function called by the main process to notify the render process with a message.

### Using Notifiers

For example, sometimes there is a long running operation on the main process and you may want to provide the render process with an update as to it's progress.

You can use notifiers to send a message to the emiter on the render process by using `res.notify` without resolving the promise.

```js
import { emit } from 'eiphop';

emit(
  'download',
  {
    /* fileIds, etc */
  },
  (msg) => {
    console.log(msg);
  }
)
  .then((res) => console.log(res)) // will contain the downloaded file
  .catch((err) => console.log(err));

// Main process
const pingActions = {
  ping: (req, res) => {
    const { payload } = req;

    payload.filesToDownload.forEach((fileId) => {
      // Tell the render process what is happening so it can inform the user
      res.notify(`Downloading file ${fileId}`);
      downloadFile(payload.fileId);
    });

    res.send({ msg: 'pong' });
  },
};
```

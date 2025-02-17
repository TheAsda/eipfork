import { ipcRenderer } from 'electron';
import { Deferred } from './deferred';
import { NotificationCallback } from './types/notifier';
import { randomId } from './utils';

type PendingRequest = {
  deferred: Deferred<any>;
  action: string;
  payload: any;
  notifier: NotificationCallback<any>;
};

export let pendingRequests: Record<string, PendingRequest> = {};

const removePendingRequestId = (requestId: string) => {
  delete pendingRequests[requestId];
};

const undefinedNotifier = (action: string) => () => {
  console.warn(
    `You forgot to define a notifier function for the ${action} action.`
  );
};

export const emit = <Payload = any, Notification = any>(
  action: string,
  payload?: Payload,
  notifier?: NotificationCallback<Notification>
) => {
  const requestId = randomId();

  ipcRenderer.send('asyncRequest', requestId, action, payload);

  const deferred = new Deferred();
  notifier = notifier ?? undefinedNotifier(action);
  pendingRequests[requestId] = { deferred, action, payload, notifier };

  return deferred.promise;
};

export const setupFrontendListener = () => {
  ipcRenderer.on('asyncResponseNotify', (event, requestId, res) => {
    const { notifier } = pendingRequests[requestId];
    notifier(res);
  });

  ipcRenderer.on('asyncResponse', (event, requestId, res) => {
    const { deferred } = pendingRequests[requestId];
    removePendingRequestId(requestId);
    deferred.resolve(res);
  });

  ipcRenderer.on('errorResponse', (event, requestId, err) => {
    const { deferred } = pendingRequests[requestId];
    removePendingRequestId(requestId);
    deferred.reject(err);
  });
};

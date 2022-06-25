import { ipcMain } from 'electron';
import { Actions } from './types/action';
import { ResponseObject } from './types/response';

const getPrefix = (level: string) => `[${level}]`;

const getMsg = (level: string, msg: string, dump = {}) =>
  `${getPrefix(level)} ${msg} ${
    dump && Object.keys(dump).length > 0 ? ` - ${JSON.stringify(dump)}` : ''
  }`;
const log = {
  error: (msg: any, dump?: any) => console.error(getMsg('ERROR', msg, dump)),
  warn: (msg: any, dump?: any) => console.warn(getMsg('WARN', msg, dump)),
  info: (msg: any, dump?: any) => console.log(getMsg('INFO', msg, dump)),
};

const isPromise = <T = any>(obj: any): obj is Promise<T> => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
};

export const setupMainHandler = (
  availableActions: Actions,
  enableLogs = false
) => {
  enableLogs && log.info('Logs enabled !');
  ipcMain.on('asyncRequest', (event, requestId, action, payload) => {
    enableLogs &&
      log.info(
        `Got new request with id = ${requestId}, action = ${action}`,
        payload
      );

    const res: ResponseObject<any, any> = {
      notify: (message) =>
        event.sender.send('asyncResponseNotify', requestId, message),
      send: (result) => event.sender.send('asyncResponse', requestId, result),
      error: (err) => event.sender.send('errorResponse', requestId, err),
    };

    const requestedAction = availableActions[action];

    if (!requestedAction) {
      const error = `Action "${action}" is not available. Did you forget to define it ?`;
      log.error(error);
      res.error({ msg: error });
      return;
    }

    try {
      const promise = requestedAction({ payload }, res);

      if (isPromise(promise)) {
        promise.catch((e) => {
          //error in async code
          log.error(e);
          res.error({ error: e.toString() });
        });
      }
    } catch (e) {
      //error inside sync code
      log.error(e);
      res.error({ error: (e as Error).toString() });
    }
  });
};

import { ipcMain } from 'electron';
import { Actions } from './types/action';
import { ResponseObject } from './types/response';

export const setupMainHandler = (availableActions: Actions) => {
  ipcMain.on(
    'asyncRequest',
    async (event, requestId: string, action: string, payload: any) => {
      const response: ResponseObject<any, any> = {
        notify: (message) =>
          event.sender.send('asyncResponseNotify', requestId, message),
        send: (result) => event.sender.send('asyncResponse', requestId, result),
        error: (err) => event.sender.send('errorResponse', requestId, err),
      };

      const requestedAction = availableActions[action];

      if (!requestedAction) {
        const error = `Action "${action}" is not available. Did you forget to define it ?`;
        response.error({ msg: error });
        return;
      }

      try {
        await requestedAction({ payload }, response);
      } catch (e) {
        response.error({ error: (e as Error).toString() });
      }
    }
  );
};

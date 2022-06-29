import { RequestObject } from './request';
import { ResponseObject } from './response';

export type Action = <Payload = any, Response = any, Error = any>(
  request: RequestObject<Payload>,
  response: ResponseObject<Response, Error>
) => void | Promise<void>;

export type Actions = Record<string, Action>;

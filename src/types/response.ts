export type ResponseObject<Response, Error> = {
  send: (response?: Response) => void;
  notify: (response?: Response) => void;
  error: (error?: Error) => void;
};

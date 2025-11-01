declare module 'express' {
  export interface Request {
    body: any;
    headers: any;
  }
  export interface Response {
    on(event: string, callback: () => void): void;
  }
  interface Express {
    use(middleware: any): void;
    post(path: string, handler: any): void;
    listen(port: number, callback?: () => void): void;
  }
  function express(): Express;
  namespace express {
    function json(): any;
  }
  export = express;
}
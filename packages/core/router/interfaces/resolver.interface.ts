export interface Resolver {
  resolve(instance: any);
  registerNotFoundHandler();
  registerExceptionHandler();
}

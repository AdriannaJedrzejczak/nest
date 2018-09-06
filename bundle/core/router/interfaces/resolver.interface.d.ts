export interface Resolver {
    resolve(instance: any): any;
    registerNotFoundHandler(): any;
    registerExceptionHandler(): any;
}

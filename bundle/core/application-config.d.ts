import { PipeTransform, WebSocketAdapter, ExceptionFilter, NestInterceptor, CanActivate } from '@nestjs/common';
import { ConfigurationProvider } from '@nestjs/common/interfaces/configuration-provider.interface';
import { RouteInfo } from '@nestjs/common/interfaces';
export interface GlobalPrefixConfig {
    readonly exclude: Array<RouteInfo>;
}
export declare class ApplicationConfig implements ConfigurationProvider {
    private ioAdapter;
    private globalPipes;
    private globalFilters;
    private globalInterceptors;
    private globalGuards;
    private globalPrefix;
    private globalPrefixConfig;
    constructor(ioAdapter?: WebSocketAdapter | null);
    setGlobalPrefix(prefix: string): void;
    getGlobalPrefix(): string;
    setGlobalPrefixConfig(globalPrefixConfig: GlobalPrefixConfig): void;
    getGlobalPrefixConfig(): GlobalPrefixConfig;
    setIoAdapter(ioAdapter: WebSocketAdapter): void;
    getIoAdapter(): WebSocketAdapter;
    addGlobalPipe(pipe: PipeTransform<any>): void;
    useGlobalPipes(...pipes: PipeTransform<any>[]): void;
    getGlobalFilters(): ExceptionFilter[];
    addGlobalFilter(filter: ExceptionFilter): void;
    useGlobalFilters(...filters: ExceptionFilter[]): void;
    getGlobalPipes(): PipeTransform<any>[];
    getGlobalInterceptors(): NestInterceptor[];
    addGlobalInterceptor(interceptor: NestInterceptor): void;
    useGlobalInterceptors(...interceptors: NestInterceptor[]): void;
    getGlobalGuards(): CanActivate[];
    addGlobalGuard(guard: CanActivate): void;
    useGlobalGuards(...guards: CanActivate[]): void;
}

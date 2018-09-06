import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { Logger } from '@nestjs/common/services/logger.service';
import { isUndefined, validatePath } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { ApplicationConfig } from '../application-config';
import { UnknownRequestMappingException } from '../errors/exceptions/unknown-request-mapping.exception';
import { GuardsConsumer } from '../guards/guards-consumer';
import { GuardsContextCreator } from '../guards/guards-context-creator';
import { routeMappedMessage } from '../helpers/messages';
import { RouterMethodFactory } from '../helpers/router-method-factory';
import { NestContainer } from '../injector/container';
import { InterceptorsConsumer } from '../interceptors/interceptors-consumer';
import { InterceptorsContextCreator } from '../interceptors/interceptors-context-creator';
import { MetadataScanner } from '../metadata-scanner';
import { PipesConsumer } from '../pipes/pipes-consumer';
import { PipesContextCreator } from '../pipes/pipes-context-creator';
import { ExceptionsFilter } from './interfaces/exceptions-filter.interface';
import { RouteParamsFactory } from './route-params-factory';
import { RouterExecutionContext } from './router-execution-context';
import { RouterProxy, RouterProxyCallback } from './router-proxy';
import { RouteInfo } from '@nestjs/common/interfaces';

export interface RoutePathProperties {
  path: string;
  requestMethod: RequestMethod;
  targetCallback: RouterProxyCallback;
  methodName: string;
}

export interface PathParts {
  base: string;
  prefix?: string;
  path: string;
}

export class RouterExplorer {
  private readonly executionContextCreator: RouterExecutionContext;
  private readonly routerMethodFactory = new RouterMethodFactory();
  private readonly logger = new Logger(RouterExplorer.name, true);

  constructor(
    private readonly metadataScanner: MetadataScanner,
    container: NestContainer,
    private readonly routerProxy?: RouterProxy,
    private readonly exceptionsFilter?: ExceptionsFilter,
    private readonly config?: ApplicationConfig,
  ) {
    this.executionContextCreator = new RouterExecutionContext(
      new RouteParamsFactory(),
      new PipesContextCreator(container, config),
      new PipesConsumer(),
      new GuardsContextCreator(container, config),
      new GuardsConsumer(),
      new InterceptorsContextCreator(container, config),
      new InterceptorsConsumer(),
      container.getApplicationRef(),
    );
  }

  public explore(
    instance: Controller,
    module: string,
    appInstance,
    pathParts: PathParts,
  ) {
    const {
      exclude: prefixExcludedRoutes,
    } = this.config.getGlobalPrefixConfig();
    const { prefixedRoutes, noPrefixedRoutes } = this.scanForPaths(
      instance,
    ).reduce(
      (acc, route) => {
        const routeInfo: RouteInfo = {
          path: route.path,
          method: route.requestMethod,
        };
        const shouldPrefix = this.isRouteExcluded(
          prefixExcludedRoutes,
          routeInfo,
        );
        if (shouldPrefix) acc.prefixedRoutes.push(route);
        else acc.noPrefixedRoutes.push(route);
        return acc;
      },
      { prefixedRoutes: [], noPrefixedRoutes: [] },
    );
    if (prefixedRoutes.length > 0) {
      const path = pathParts.base + (pathParts.prefix || '') + pathParts.path;
      this.applyPathsToRouterProxy(
        appInstance,
        prefixedRoutes,
        instance,
        module,
        this.validateRoutePath(path),
      );
    }
    if (noPrefixedRoutes.length > 0) {
      const path = pathParts.base + pathParts.path;
      this.applyPathsToRouterProxy(
        appInstance,
        noPrefixedRoutes,
        instance,
        module,
        this.validateRoutePath(path),
      );
    }
  }

  private isRouteExcluded(
    prefixExcludedRoutes: RouteInfo[],
    routeInfo: RouteInfo,
  ): boolean {
    const pathLastIndex = routeInfo.path.length - 1;
    const validatedRoutePath =
      routeInfo.path[pathLastIndex] === '/'
        ? routeInfo.path.slice(0, pathLastIndex)
        : routeInfo.path;

    return prefixExcludedRoutes.some(excluded => {
      const isPathEqual = validatedRoutePath === excluded.path;
      if (!isPathEqual) {
        return false;
      }
      return (
        routeInfo.method === excluded.method ||
        excluded.method === RequestMethod.ALL
      );
    });
  }

  public extractRouterPath(
    metatype: Type<Controller>,
    base?: string,
  ): PathParts {
    const prefix = this.validateRoutePath(this.config.getGlobalPrefix());
    const path = this.validateRoutePath(
      Reflect.getMetadata(PATH_METADATA, metatype),
    );
    return { base, prefix, path };
  }

  public validateRoutePath(path: string): string {
    if (isUndefined(path)) {
      throw new UnknownRequestMappingException();
    }
    return validatePath(path);
  }

  public scanForPaths(instance: Controller, prototype?): RoutePathProperties[] {
    const instancePrototype = isUndefined(prototype)
      ? Object.getPrototypeOf(instance)
      : prototype;
    return this.metadataScanner.scanFromPrototype<
      Controller,
      RoutePathProperties
    >(instance, instancePrototype, method =>
      this.exploreMethodMetadata(instance, instancePrototype, method),
    );
  }

  public exploreMethodMetadata(
    instance: Controller,
    instancePrototype,
    methodName: string,
  ): RoutePathProperties {
    const targetCallback = instancePrototype[methodName];
    const routePath = Reflect.getMetadata(PATH_METADATA, targetCallback);
    if (isUndefined(routePath)) {
      return null;
    }
    const requestMethod: RequestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      targetCallback,
    );
    return {
      path: this.validateRoutePath(routePath),
      requestMethod,
      targetCallback,
      methodName,
    };
  }

  public applyPathsToRouterProxy(
    router,
    routePaths: RoutePathProperties[],
    instance: Controller,
    module: string,
    basePath: string,
  ) {
    (routePaths || []).map(pathProperties => {
      const { path, requestMethod } = pathProperties;
      this.applyCallbackToRouter(
        router,
        pathProperties,
        instance,
        module,
        basePath,
      );
      this.logger.log(routeMappedMessage(path, requestMethod));
    });
  }

  private applyCallbackToRouter(
    router,
    pathProperties: RoutePathProperties,
    instance: Controller,
    module: string,
    basePath: string,
  ) {
    const { path, requestMethod, targetCallback, methodName } = pathProperties;
    const routerMethod = this.routerMethodFactory
      .get(router, requestMethod)
      .bind(router);

    const proxy = this.createCallbackProxy(
      instance,
      targetCallback,
      methodName,
      module,
      requestMethod,
    );
    const stripSlash = str =>
      str[str.length - 1] === '/' ? str.slice(0, str.length - 1) : str;
    const fullPath = stripSlash(basePath) + path;
    routerMethod(stripSlash(fullPath) || '/', proxy);
  }

  private createCallbackProxy(
    instance: Controller,
    callback: RouterProxyCallback,
    methodName: string,
    module: string,
    requestMethod,
  ) {
    const executionContext = this.executionContextCreator.create(
      instance,
      callback,
      methodName,
      module,
      requestMethod,
    );
    const exceptionFilter = this.exceptionsFilter.create(
      instance,
      callback,
      module,
    );
    return this.routerProxy.createProxy(executionContext, exceptionFilter);
  }
}

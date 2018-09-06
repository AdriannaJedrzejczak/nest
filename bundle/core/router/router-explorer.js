"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@nestjs/common/constants");
const request_method_enum_1 = require("@nestjs/common/enums/request-method.enum");
const logger_service_1 = require("@nestjs/common/services/logger.service");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
require("reflect-metadata");
const unknown_request_mapping_exception_1 = require("../errors/exceptions/unknown-request-mapping.exception");
const guards_consumer_1 = require("../guards/guards-consumer");
const guards_context_creator_1 = require("../guards/guards-context-creator");
const messages_1 = require("../helpers/messages");
const router_method_factory_1 = require("../helpers/router-method-factory");
const interceptors_consumer_1 = require("../interceptors/interceptors-consumer");
const interceptors_context_creator_1 = require("../interceptors/interceptors-context-creator");
const pipes_consumer_1 = require("../pipes/pipes-consumer");
const pipes_context_creator_1 = require("../pipes/pipes-context-creator");
const route_params_factory_1 = require("./route-params-factory");
const router_execution_context_1 = require("./router-execution-context");
class RouterExplorer {
    constructor(metadataScanner, container, routerProxy, exceptionsFilter, config) {
        this.metadataScanner = metadataScanner;
        this.routerProxy = routerProxy;
        this.exceptionsFilter = exceptionsFilter;
        this.config = config;
        this.routerMethodFactory = new router_method_factory_1.RouterMethodFactory();
        this.logger = new logger_service_1.Logger(RouterExplorer.name, true);
        this.executionContextCreator = new router_execution_context_1.RouterExecutionContext(new route_params_factory_1.RouteParamsFactory(), new pipes_context_creator_1.PipesContextCreator(container, config), new pipes_consumer_1.PipesConsumer(), new guards_context_creator_1.GuardsContextCreator(container, config), new guards_consumer_1.GuardsConsumer(), new interceptors_context_creator_1.InterceptorsContextCreator(container, config), new interceptors_consumer_1.InterceptorsConsumer(), container.getApplicationRef());
    }
    explore(instance, module, appInstance, pathParts) {
        const { exclude: prefixExcludedRoutes, } = this.config.getGlobalPrefixConfig();
        const { prefixedRoutes, noPrefixedRoutes } = this.scanForPaths(instance).reduce((acc, route) => {
            const routeInfo = {
                path: route.path,
                method: route.requestMethod,
            };
            const shouldPrefix = this.isRouteExcluded(prefixExcludedRoutes, routeInfo);
            if (shouldPrefix)
                acc.prefixedRoutes.push(route);
            else
                acc.noPrefixedRoutes.push(route);
            return acc;
        }, { prefixedRoutes: [], noPrefixedRoutes: [] });
        if (prefixedRoutes.length > 0) {
            const path = pathParts.base + (pathParts.prefix || '') + pathParts.path;
            this.applyPathsToRouterProxy(appInstance, prefixedRoutes, instance, module, this.validateRoutePath(path));
        }
        if (noPrefixedRoutes.length > 0) {
            const path = pathParts.base + pathParts.path;
            this.applyPathsToRouterProxy(appInstance, noPrefixedRoutes, instance, module, this.validateRoutePath(path));
        }
    }
    isRouteExcluded(prefixExcludedRoutes, routeInfo) {
        const pathLastIndex = routeInfo.path.length - 1;
        const validatedRoutePath = routeInfo.path[pathLastIndex] === '/'
            ? routeInfo.path.slice(0, pathLastIndex)
            : routeInfo.path;
        return prefixExcludedRoutes.some(excluded => {
            const isPathEqual = validatedRoutePath === excluded.path;
            if (!isPathEqual) {
                return false;
            }
            return (routeInfo.method === excluded.method ||
                excluded.method === request_method_enum_1.RequestMethod.ALL);
        });
    }
    extractRouterPath(metatype, base) {
        const prefix = this.validateRoutePath(this.config.getGlobalPrefix());
        const path = this.validateRoutePath(Reflect.getMetadata(constants_1.PATH_METADATA, metatype));
        return { base, prefix, path };
    }
    validateRoutePath(path) {
        if (shared_utils_1.isUndefined(path)) {
            throw new unknown_request_mapping_exception_1.UnknownRequestMappingException();
        }
        return shared_utils_1.validatePath(path);
    }
    scanForPaths(instance, prototype) {
        const instancePrototype = shared_utils_1.isUndefined(prototype)
            ? Object.getPrototypeOf(instance)
            : prototype;
        return this.metadataScanner.scanFromPrototype(instance, instancePrototype, method => this.exploreMethodMetadata(instance, instancePrototype, method));
    }
    exploreMethodMetadata(instance, instancePrototype, methodName) {
        const targetCallback = instancePrototype[methodName];
        const routePath = Reflect.getMetadata(constants_1.PATH_METADATA, targetCallback);
        if (shared_utils_1.isUndefined(routePath)) {
            return null;
        }
        const requestMethod = Reflect.getMetadata(constants_1.METHOD_METADATA, targetCallback);
        return {
            path: this.validateRoutePath(routePath),
            requestMethod,
            targetCallback,
            methodName,
        };
    }
    applyPathsToRouterProxy(router, routePaths, instance, module, basePath) {
        (routePaths || []).map(pathProperties => {
            const { path, requestMethod } = pathProperties;
            this.applyCallbackToRouter(router, pathProperties, instance, module, basePath);
            this.logger.log(messages_1.routeMappedMessage(path, requestMethod));
        });
    }
    applyCallbackToRouter(router, pathProperties, instance, module, basePath) {
        const { path, requestMethod, targetCallback, methodName } = pathProperties;
        const routerMethod = this.routerMethodFactory
            .get(router, requestMethod)
            .bind(router);
        const proxy = this.createCallbackProxy(instance, targetCallback, methodName, module, requestMethod);
        const stripSlash = str => str[str.length - 1] === '/' ? str.slice(0, str.length - 1) : str;
        const fullPath = stripSlash(basePath) + path;
        routerMethod(stripSlash(fullPath) || '/', proxy);
    }
    createCallbackProxy(instance, callback, methodName, module, requestMethod) {
        const executionContext = this.executionContextCreator.create(instance, callback, methodName, module, requestMethod);
        const exceptionFilter = this.exceptionsFilter.create(instance, callback, module);
        return this.routerProxy.createProxy(executionContext, exceptionFilter);
    }
}
exports.RouterExplorer = RouterExplorer;

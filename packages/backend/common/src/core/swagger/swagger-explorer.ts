import { ControllerExplorer } from './explorers/controller-explorer';
import { RouteExplorer } from './explorers/route-explorer';
import { MetadataExtractor } from './explorers/metadata-extractor';
import { SchemaGenerator } from './explorers/schema-generator';
import { OperationBuilder } from './explorers/operation-builder';
import { ParamMetadata } from '../../domain/interfaces/nest/nest-core.interface';
import { SwaggerConfig, OpenAPIObject, OpenAPIOperation } from '../../domain/interfaces/infra/swagger-config.interface';
import { Constructor } from '../../domain/types/common/util.type';

export class SwaggerExplorer {
  private readonly controllerExplorer = new ControllerExplorer();
  private readonly routeExplorer = new RouteExplorer();
  private readonly metadataExtractor = new MetadataExtractor();
  private readonly schemaGenerator = new SchemaGenerator();
  private readonly operationBuilder: OperationBuilder;

  constructor () {
    this.operationBuilder = new OperationBuilder(this.metadataExtractor, this.schemaGenerator, this.routeExplorer);
  }

  explore (config: SwaggerConfig): OpenAPIObject {
    const paths: Record<string, Record<string, OpenAPIOperation>> = {};
    const controllers = this.controllerExplorer.exploreControllers();
    controllers.forEach(controllerInfo => this.processController(controllerInfo, paths));
    return this.buildOpenAPIObject(config, paths);
  }

  private processController (
    controllerInfo: {
      controller: Constructor;
      basePath: string;
      requiresAuth: boolean;
      isPublic: boolean;
      methods: string[];
    },
    paths: Record<string, Record<string, OpenAPIOperation>>
  ): void {
    const { controller, basePath, requiresAuth, isPublic, methods } = controllerInfo;
    const prototype = controller.prototype as object;
    methods.forEach(methodName => this.processMethod(controller, prototype, methodName, basePath, requiresAuth, isPublic, paths));
  }

  private processMethod (
    controller: Constructor,
    prototype: object,
    methodName: string,
    basePath: string,
    controllerRequiresAuth: boolean,
    controllerIsPublic: boolean,
    paths: Record<string, Record<string, OpenAPIOperation>>
  ): void {
    const routeInfos = this.routeExplorer.exploreRoutes(prototype, methodName);
    routeInfos.forEach(routeInfo => {
      this.processRoute(controller, prototype, methodName, basePath, controllerRequiresAuth, controllerIsPublic, routeInfo, paths);
    });
  }

  private processRoute (
    controller: Constructor,
    prototype: object,
    methodName: string,
    basePath: string,
    controllerRequiresAuth: boolean,
    controllerIsPublic: boolean,
    routeInfo: {
      route: { path: string; method: string };
      params: ParamMetadata[];
      paramTypes: Constructor[];
    },
    paths: Record<string, Record<string, OpenAPIOperation>>
  ): void {
    const fullPath = this.routeExplorer.normalizePath(basePath, routeInfo.route.path);
    const httpMethod = routeInfo.route.method.toLowerCase();
    if (!paths[fullPath]) paths[fullPath] = {};
    const operation = this.operationBuilder.createOperation(controller, prototype, methodName, controllerRequiresAuth, controllerIsPublic, routeInfo);
    paths[fullPath][httpMethod] = operation;
  }

  private buildOpenAPIObject (config: SwaggerConfig, paths: Record<string, Record<string, OpenAPIOperation>>): OpenAPIObject {
    return {
      openapi: '3.0.0',
      info: {
        title: config.title,
        description: config.description,
        version: config.version
      },
      paths,
      components: {
        schemas: this.schemaGenerator.getSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ...config.securitySchemes
        }
      }
    };
  }
}

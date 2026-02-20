import { MetadataExtractor } from './metadata-extractor';
import { SchemaGenerator } from './schema-generator';
import { RouteExplorer } from './route-explorer';
import { ParameterHandler } from './parameter-handler';
import { ParamMetadata } from '../../../domain/interfaces/nest/nest-core.interface';
import { OpenAPIOperation } from '../../../domain/interfaces/infra/swagger-config.interface';
import { Constructor } from '../../../domain/types/common/util.type';

export class OperationBuilder {
  private readonly parameterHandler: ParameterHandler;

  constructor (
    private readonly metadataExtractor: MetadataExtractor,
    schemaGenerator: SchemaGenerator,
    private readonly routeExplorer: RouteExplorer
  ) {
    this.parameterHandler = new ParameterHandler(schemaGenerator);
  }

  createOperation (
    controller: Constructor,
    prototype: object,
    methodName: string,
    controllerRequiresAuth: boolean,
    controllerIsPublic: boolean,
    routeInfo: {
      params: ParamMetadata[];
      paramTypes: Constructor[];
    }
  ): OpenAPIOperation {
    const operation: OpenAPIOperation = {
      summary: this.routeExplorer.humanize(methodName),
      operationId: `${controller.name}_${methodName}`,
      tags: [this.routeExplorer.humanize(controller.name.replace('Controller', ''))],
      responses: this.getDefaultResponses(),
      parameters: []
    };

    this.addSecurityToOperation(operation, controller, prototype, methodName, controllerRequiresAuth, controllerIsPublic);
    this.parameterHandler.addParametersToOperation(operation, routeInfo.params, routeInfo.paramTypes);

    return operation;
  }

  private getDefaultResponses (): Record<string, { description: string }> {
    return {
      '200': { description: 'Successful operation' },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden' },
      '500': { description: 'Internal Server Error' }
    };
  }

  private addSecurityToOperation (
    operation: OpenAPIOperation,
    controller: Constructor,
    prototype: object,
    methodName: string,
    controllerRequiresAuth: boolean,
    controllerIsPublic: boolean
  ): void {
    const securityMetadata = this.metadataExtractor.extractSecurityMetadata(
      controller,
      prototype,
      methodName,
      controllerRequiresAuth,
      controllerIsPublic
    );

    if (securityMetadata.requiresAuth || securityMetadata.roles) operation.security = [{ bearerAuth: [] }];
    if (securityMetadata.hasHeaderAuth) operation.security = [...(operation.security || []), { 'health-key': [] }];
    if (securityMetadata.security) operation.security = [...(operation.security || []), ...securityMetadata.security];
  }
}

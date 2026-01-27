import { GraphQLApplication } from './graphql-application';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/common.interface';
import { Constructor } from '../../domain/types/common.type';

@Module({
  providers: [],
  exports: []
})
export class GraphQLModule {
  static forRoot (options: { resolvers: Constructor[] }): DynamicModule {
    const { resolvers } = options;

    return {
      module: GraphQLModule,
      global: true,
      providers: [
        GraphQLApplication,
        ...resolvers.map(resolver => ({
          provide: resolver,
          useClass: resolver
        })),
        {
          provide: 'GRAPHQL_INITIALIZER',
          useFactory: ((graphqlApp: GraphQLApplication, lifecycleService: LifecycleService) => {
            return () => {
              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({
                  name: 'GraphQL',
                  disconnect: () => {
                    graphqlApp.destroy();
                    return Promise.resolve();
                  }
                });
              }
            };
          }) as (...args: unknown[]) => unknown,
          inject: [GraphQLApplication, LifecycleService]
        }
      ],
      exports: [GraphQLApplication, 'GRAPHQL_INITIALIZER', ...resolvers]
    };
  }
}

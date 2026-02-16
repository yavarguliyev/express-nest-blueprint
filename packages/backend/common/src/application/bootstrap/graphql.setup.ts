import { NestApplication } from '../nest-application';
import { GraphQLApplication } from '../../core/graphql/graphql-application';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';

export class GraphQLSetup {
  static setup (app: NestApplication): void {
    const configService = app.get(ConfigService);
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const graphqlApp = app.get(GraphQLApplication);

    graphqlApp.applyMiddleware(app.getExpressApp(), '/graphql');
    graphqlApp.applyMiddleware(app.getExpressApp(), '/admin/graphql');

    if (!isProduction) {
      graphqlApp.applyGraphiQL(app.getExpressApp(), '/graphiql');
      graphqlApp.applyGraphiQL(app.getExpressApp(), '/admin/graphiql');
      Logger.log('🔮 GraphQL endpoints enabled at /graphql and /admin/graphql', 'GraphQLSetup');
      Logger.log('🎮 GraphiQL playgrounds enabled at /graphiql and /admin/graphiql', 'GraphQLSetup');
    }
  }
}

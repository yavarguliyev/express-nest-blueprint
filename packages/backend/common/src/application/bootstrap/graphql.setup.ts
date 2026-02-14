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

    if (!isProduction) {
      graphqlApp.applyGraphiQL(app.getExpressApp(), '/graphiql');
      Logger.log('🔮 GraphQL endpoint enabled at /graphql', 'GraphQLSetup');
      Logger.log('🎮 GraphiQL playground enabled at /graphiql', 'GraphQLSetup');
    }
  }
}

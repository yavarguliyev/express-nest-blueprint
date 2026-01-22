import { createHandler } from 'graphql-http/lib/use/express';
import { Express, Request, Response } from 'express';

import { SchemaBuilder } from './schema/schema-builder';
import { Container } from '../container/container';
import { Injectable } from '../decorators/injectable.decorator';

@Injectable()
export class GraphQLApplication {
  private schemaBuilder: SchemaBuilder;

  constructor (container: Container) {
    this.schemaBuilder = new SchemaBuilder(container);
  }

  applyMiddleware (app: Express, path = '/graphql'): void {
    const schema = this.schemaBuilder.build();
    app.all(path, createHandler({ schema, context: (req, res) => ({ req, res }) }));
  }

  destroy (): void {
    this.schemaBuilder.clearCache();
  }

  applyGraphiQL (app: Express, path = '/graphiql'): void {
    app.get(path, (_req: Request, res: Response) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GraphiQL</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.10/graphiql.min.css" />
          </head>
          <body style="margin: 0;">
            <div id="graphiql" style="height: 100vh;"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.10/graphiql.min.js"></script>
            <script>
              const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
              ReactDOM.render(
                React.createElement(GraphiQL, { fetcher }),
                document.getElementById('graphiql'),
              );
            </script>
          </body>
        </html>
      `);
    });
  }
}

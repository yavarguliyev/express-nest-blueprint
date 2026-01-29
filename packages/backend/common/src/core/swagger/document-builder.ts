import { SwaggerConfig } from '../../domain/interfaces/infra/swagger-config.interface';

export class DocumentBuilder {
  private config: SwaggerConfig = {
    title: '',
    description: '',
    version: '1.0.0'
  };

  setTitle (title: string): this {
    this.config.title = title;
    return this;
  }

  setDescription (description: string): this {
    this.config.description = description;
    return this;
  }

  setVersion (version: string): this {
    this.config.version = version;
    return this;
  }

  addApiKey (options: { type: 'apiKey'; name: string; in: 'header' | 'query' | 'cookie'; description?: string }, name: string = 'api_key'): this {
    this.config.securitySchemes = {
      ...this.config.securitySchemes,
      [name]: options
    };
    return this;
  }

  addBearerAuth (
    options: { type: 'http'; scheme: 'bearer'; bearerFormat?: string; description?: string } = {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    name: string = 'bearer'
  ): this {
    this.config.securitySchemes = {
      ...this.config.securitySchemes,
      [name]: options
    };
    return this;
  }

  build (): SwaggerConfig {
    return this.config;
  }
}

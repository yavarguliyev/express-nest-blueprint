import { SwaggerConfig } from './interfaces/swagger-config.interface';

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

  build (): SwaggerConfig {
    return this.config;
  }
}

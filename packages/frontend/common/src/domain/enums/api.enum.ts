export enum ApiProtocol {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL'
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export enum RequestStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

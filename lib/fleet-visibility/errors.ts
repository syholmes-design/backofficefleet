export class FleetVisibilityError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "FleetVisibilityError";
    this.statusCode = statusCode;
  }
}

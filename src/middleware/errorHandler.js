const { AppError } = require("../errors/AppError");

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, requestId: req.id }
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON", requestId: req.id }
    });
  }

  if (err.code === "23505" && err.constraint === "users_email_unique") {
    return res.status(409).json({
      error: { code: "EMAIL_TAKEN", message: "Email already registered", requestId: req.id }
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      error: { code: "UNIQUE_VIOLATION", message: "Resource already exists", requestId: req.id }
    });
  }

  if (err.code === "23503") {
    return res.status(409).json({
      error: { code: "RESOURCE_IN_USE", message: "Resource is referenced by other resources", requestId: req.id }
    });
  }

  if (err.code === "23P01") {
    return res.status(409).json({
      error: { code: "ROOM_ALREADY_BOOKED", message: "Room is already booked in this time range", requestId: req.id }
    });
  }

  console.error(`[${req.id}]`, err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected error", requestId: req.id }
  });
}

module.exports = errorHandler;

const { NotFoundError } = require("../errors/AppError");

module.exports = (req, res, next) => next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));

const notFound = (req, res, next) => {
  res.status(404);
  res.json({ message: `Not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error(
    `${req.method} ${req.originalUrl} ${statusCode}`,
    err.message,
    err.stack
  );

  res.status(statusCode);
  res.json({
    message: err.message || "Server error",
  });
};

module.exports = { notFound, errorHandler };

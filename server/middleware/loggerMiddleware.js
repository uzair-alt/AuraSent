const morgan = require("morgan");
const { NODE_ENV } = require("../config");

const requestLogger =
  NODE_ENV === "production" ? morgan("combined") : morgan("dev");

module.exports = { requestLogger };


import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert non-ApiError errors to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, []);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    };

    return res.status(error.statusCode).json(response);
};

export default errorHandler;

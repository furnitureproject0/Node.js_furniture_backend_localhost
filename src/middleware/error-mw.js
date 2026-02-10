const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    console.error(err);
    res.status(err.statusCode).json({
        status: err.status,
        success: false,
        message: err.message,
    });
}

export default errorMiddleware;
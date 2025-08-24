const asyncHandler = (requestHandler) => {
    (req,res,next)  => {
    return Promise.resolve(requestHandler(req, res, next))
        .catch((error) => {
            console.error("Error occurred in async handler:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message || "An unexpected error occurred"
            });
        });
}    
}/*const asyncHandler = (fn) => async(req,res,next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error occurred in async handler:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message || "An unexpected error occurred"
        });
    }
}*/
export default asyncHandler;
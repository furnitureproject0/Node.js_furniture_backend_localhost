const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body,
            { abortEarly: false }
        );

        if (error) {
            console.log(req.body)
            console.log(req.file)
            const message = "validation error"
            const errors = {}
            error.details.forEach(detail => {
                const field = detail.path[0];
                if (!errors[field]) {
                    errors[field] = [];
                }
                errors[field].push(detail.message);
            });

            res.status(400).json({
                success: false,
                message,
                errors
            })

            return;
        }
        next();
    }
}

export default validate;
class errorAPI extends Error{
    private statusCode: number;
    private error: any[];
    private success: boolean;

    constructor(
        statusCode: number ,
        message: string,
        error: any[] = [],
        stack: string = ""

    ){
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.success = false
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { errorAPI };
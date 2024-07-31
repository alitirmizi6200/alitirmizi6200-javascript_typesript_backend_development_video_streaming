class responseAPI<T>{
    private statusCode: number;
    private data: T;
    private message: string;
    private success: boolean;
    constructor(statusCode: number, data: T, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { responseAPI }
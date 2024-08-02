declare namespace Express {
    export interface Request {
        user?: any;
    }
    export interface Response {
        user?: any;
    }
}

// add custom element user in req and res
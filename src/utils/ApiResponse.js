class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }
}

export default ApiResponse;

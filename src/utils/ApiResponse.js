class ApiResponse {
    constructor(statusCode, data, message ="Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message

        // server ke statuscode hote h standards
        this.success = statusCode < 400
    }
}

export {ApiResponse}
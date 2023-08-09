export interface ApiError {
    status: number,
    title: string,
    message: string
}

export interface ApiResponse {
    result?: string
    data?: Object | null
    errors?: ApiError[]
}

export function GenerateApiResponse(
    body?: Object | null,
    errors?: ApiError[],
    statusCode?: number
): Response {
    const responseBody: ApiResponse = {
        result: errors ? 'error' : 'ok',
        data: body,
        errors: errors
    }

    return new Response(
        JSON.stringify(responseBody),
        {
            status: statusCode,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }
    )
}
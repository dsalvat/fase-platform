import { NextResponse } from "next/server";

/**
 * Standard success response format
 * @param data - Data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Standard error response format
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error format
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Handle API errors with appropriate status codes
 * @param error - Error object
 * @returns NextResponse with error format and appropriate status
 */
export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof Error) {
    // Authentication error
    if (error.message === "Unauthorized") {
      return errorResponse("Authentication required", 401);
    }

    // Authorization error
    if (error.message === "Forbidden") {
      return errorResponse("Access denied", 403);
    }

    // Not found error
    if (error.message.includes("not found") || error.message.includes("Not found")) {
      return errorResponse(error.message, 404);
    }

    // Validation error
    if (error.message.includes("validation") || error.message.includes("Invalid")) {
      return errorResponse(error.message, 400);
    }

    // Generic error with message
    return errorResponse(error.message, 400);
  }

  // Unknown error
  return errorResponse("Internal server error", 500);
}

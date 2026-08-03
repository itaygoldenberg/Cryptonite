import { handleApiRequest } from "../[...path].js";

// Forwards AI advice requests to the shared serverless handler.
export default function handler(request, response) {
    return handleApiRequest(request, response, "/ai/advice");
}

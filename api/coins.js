import { handleApiRequest } from "./[...path].js";

// Forwards the top-coins route to the shared serverless handler.
export default function handler(request, response) {
    return handleApiRequest(request, response, "/coins");
}

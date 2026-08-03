import { handleApiRequest } from "../[...path].js";

// Forwards batched report prices to the shared serverless handler.
export default function handler(request, response) {
    return handleApiRequest(request, response, "/reports/prices");
}

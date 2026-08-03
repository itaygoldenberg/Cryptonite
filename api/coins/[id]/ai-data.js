import { handleApiRequest } from "../../[...path].js";

// Forwards one coin's AI market-data request to the shared serverless handler.
export default function handler(request, response) {
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    return handleApiRequest(request, response, "/coins/" + encodeURIComponent(id) + "/ai-data");
}

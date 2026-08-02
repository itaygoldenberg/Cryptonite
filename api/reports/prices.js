import { handleApiRequest } from "../[...path].js";

export default function handler(request, response) {
    return handleApiRequest(request, response, "/reports/prices");
}

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const OBFUSCATION_MASK = "Cryptonite submission key mask v1";
const ENCRYPTED_PREFIX = "enc:";
const label = process.argv[2] || "API";

function encryptApiKey(value) {
    const keyBytes = new TextEncoder().encode(value.trim());
    const maskBytes = new TextEncoder().encode(OBFUSCATION_MASK);
    const encryptedBytes = keyBytes.map((byte, index) => byte ^ maskBytes[index % maskBytes.length]);

    return ENCRYPTED_PREFIX + Buffer.from(encryptedBytes).toString("base64");
}

const terminal = createInterface({ input, output });
const apiKey = await terminal.question("Paste the API key: ");
terminal.close();

if (!apiKey.trim()) {
    console.error("No API key was provided.");
    process.exitCode = 1;
}
else {
    console.log(`\nEncrypted ${label || "API"} key:`);
    console.log(encryptApiKey(apiKey));
    console.log("\nPaste only this value into the matching encrypted constant in src/utils/app-config.ts.");
}

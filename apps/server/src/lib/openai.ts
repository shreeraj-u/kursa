import OpenAI from "openai";
import { env } from "@kursa/env/server";

export const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});
import OpenAI from "openai";
const openai = new OpenAI();

export const aiService =  async  () => {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {role: "system", content: "You are a test version."},
            {
                role: "developer",
                content: "Send lil tokens for me pls",
            },
        ],
    });

    return completion;
}
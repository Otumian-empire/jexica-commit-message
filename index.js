const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { exec } = require("child_process");

const envManager = require("./env.manager");

const groq = new Groq({ apiKey: envManager.GROQ_API_KEY });
const gemini = new GoogleGenerativeAI(envManager.GEMINI_API_KEY);
const geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getGitDiff() {
    return new Promise((resolve, reject) => {
        exec("git diff HEAD~1..HEAD", (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function getGroqChatCompletion(content) {
    const result = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: content,
            },
        ],
        model: "llama3-8b-8192",
    });

    return result.choices[0]?.message?.content ?? "";
}

async function getGeminiChatCompletion(diff) {
    const result = await geminiModel.generateContent([diff]);
    return result.response.text();
}

async function main() {
    try {
        // this is the prompt
        const diff = await getGitDiff();

        const prompt = `Generate a commit message based on the following diff:\n${diff}`;

        const [groqOutput, geminiOutput] = await Promise.all([
            getGroqChatCompletion(prompt),
            getGeminiChatCompletion(prompt),
        ]);

        console.log({ groqOutput, geminiOutput });
    } catch (error) {
        console.log(error);
    }
}

main();

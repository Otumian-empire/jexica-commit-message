require("dotenv/config")
const Groq = require("groq-sdk");
const { exec } = require("child_process");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGitDiff() {
    return new Promise((resolve, reject) => {
        exec('git diff HEAD~1..HEAD', (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function getGroqChatCompletion(diff) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: `Generate a commit message based on the following diff:\n${diff}`,
            },
        ],
        model: "llama3-8b-8192",
    });
}

async function main() {
    try {
        const diff = await getGitDiff();
        const chatCompletion = await getGroqChatCompletion(diff);

        console.log(chatCompletion.choices[0]?.message?.content ?? "");
    } catch (error) {
        console.log(error);
    }
}

main();
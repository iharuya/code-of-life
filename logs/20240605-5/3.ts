import { parseArgs } from "jsr:@std/cli"
import { ensureDir } from "jsr:@std/fs"
import { load } from "jsr:@std/dotenv"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { sleep } from "jsr:@iharuya/time"

await load({ export: true })
const GEMINI_KEY = Deno.env.get("GEMINI_KEY")
if (!GEMINI_KEY) {
	console.error("エラー: 環境変数にGEMINI_KEYをセットしてください")
	Deno.exit(1)
}

const args = parseArgs(Deno.args, {
	boolean: ["help"],
	string: ["model", "log"],
	default: {
		model: "gemini-1.5-pro",
		log: "",
	},
})

if (args.help) {
	console.log("Usage: index.ts [options]")
	console.log("Options:")
	console.log("  --model <model>  モデルを指定します")
	console.log("  --log <log>  ログを出力するディレクトリパスを指定します")
	Deno.exit(0)
}

const thisFileText = await Deno.readTextFile("index.ts")

if (args.log !== "") {
	await ensureDir(args.log)
	const items = await Array.fromAsync(Deno.readDir(args.log))
	const logFileNumber = items.length + 1
	const logFileName = `${logFileNumber}.ts`
	const logFilePath = `${args.log}/${logFileName}`
	await Deno.writeTextFile(logFilePath, thisFileText)
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: args.model, generationConfig: { 
	temperature: 2,
}})

async function generateNextGeneration(code: string): Promise<string> {
	const result = await model.generateContent(code, )
	return result.response.text()
		.replace(/```(?:ts|typescript)\s*/, "")
		.replace(/```$/, "");
}

const codeHistory: string[] = [thisFileText];
const maxGenerations = 5; 

// 評価関数の定義
async function evaluateCode(code: string): Promise<number> {
	try {
		// コードを一時ファイルに書き込む
		const tempFilePath = Deno.makeTempFileSync({ suffix: ".ts" });
		await Deno.writeTextFile(tempFilePath, code);

		// コードを実行し、標準出力を取得
		const command = new Deno.Command("deno", {
			args: ["run", "-A", tempFilePath],
			stdout: "piped",
		});
		const { stdout } = await command.output();

		// 評価指標を計算 (ここでは標準出力の行数を例とする)
		const lineCount = stdout.toString().split("\n").length;
		
		// 一時ファイルを削除
		await Deno.remove(tempFilePath);
		
		return lineCount; 
	} catch (error) {
		console.error("コードの実行中にエラーが発生しました:", error);
		return 0; 
	}
}


async function evolveCode() {
	let bestCode = thisFileText;
	let bestScore = await evaluateCode(bestCode); 

	for (let generation = 1; generation <= maxGenerations; generation++) {
		console.log(`Generation ${generation}:`);
		const currentCode = await generateNextGeneration(bestCode);
		codeHistory.push(currentCode); 

		const currentScore = await evaluateCode(currentCode);
		console.log(`- Score: ${currentScore}`);

		if (currentScore > bestScore) { 
			bestCode = currentCode;
			bestScore = currentScore;
			console.log("- New best score!");
		}

		await Deno.writeTextFile("index.ts", bestCode); 

		const command = new Deno.Command("deno", {
			args: ["run", "-A", "index.ts", "--log", args.log],
		});
		await command.spawn();
		console.log("New generation started.");

		await sleep(1000);
	}
}

await evolveCode();

/**
 * Meta Instruction
 * 評価関数を導入し、コードの実行結果に基づいて評価するよう改良しました。
 * evaluateCode関数は、コードを一時ファイルに保存して実行し、標準出力の行数を評価指標としています。 
 * 各世代で最も評価の高いコードを保持し、次の世代の入力として使用することで、より良いコードへと進化させていきます。
 * 
 * Instruction
 * - 評価関数をより高度なものにし、コードの品質を多角的に評価できるようにしてください。
 * - コードの進化を遺伝的アルゴリズムで実装し、より効率的に探索できるようにしてください。
 */


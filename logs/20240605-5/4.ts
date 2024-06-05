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
const populationSize = 3;
const mutationRate = 0.1; 

// 評価関数の定義 (より詳細な評価指標を追加)
async function evaluateCode(code: string): Promise<number> {
	try {
		// コードを一時ファイルに書き込む
		const tempFilePath = Deno.makeTempFileSync({ suffix: ".ts" });
		await Deno.writeTextFile(tempFilePath, code);

		// コードを実行し、標準出力を取得
		const command = new Deno.Command("deno", {
			args: ["run", "-A", tempFilePath],
			stdout: "piped",
			stderr: "piped" // 標準エラー出力も取得
		});
		const { stdout, stderr } = await command.output();

		// 評価指標を計算
		const lineCount = stdout.toString().split("\n").length;
		const errorCount = stderr.toString().split("\n").filter(line => line.trim() !== "").length;

		// 一時ファイルを削除
		await Deno.remove(tempFilePath);
		
		// エラーが多い場合はペナルティを与える
		if (errorCount > 0) {
			return lineCount - (errorCount * 10); // エラー1件につき10点減点
		} else {
			return lineCount; 
		}
	} catch (error) {
		console.error("コードの実行中にエラーが発生しました:", error);
		return 0; // 実行時エラーの場合は0点
	}
}

// コードの突然変異
function mutateCode(code: string): string {
	const codeLines = code.split("\n");
	const mutatedLines = codeLines.map(line => {
		if (Math.random() < mutationRate) {
			// ランダムな位置に文字を挿入
			const insertIndex = Math.floor(Math.random() * (line.length + 1));
			const randomCharCode = Math.floor(Math.random() * 26) + 97; // a-z
			return line.substring(0, insertIndex) + String.fromCharCode(randomCharCode) + line.substring(insertIndex);
		} else {
			return line;
		}
	});
	return mutatedLines.join("\n");
}

// 交叉
function crossoverCode(code1: string, code2: string): string {
	const codeLines1 = code1.split("\n");
	const codeLines2 = code2.split("\n");
	const crossoverPoint = Math.floor(Math.random() * (Math.min(codeLines1.length, codeLines2.length) - 1)) + 1;
	const newCodeLines = [...codeLines1.slice(0, crossoverPoint), ...codeLines2.slice(crossoverPoint)];
	return newCodeLines.join("\n");
}


async function evolveCode() {
	let population = Array(populationSize).fill(thisFileText);
	
	for (let generation = 1; generation <= maxGenerations; generation++) {
		console.log(`Generation ${generation}:`);
		
		// 評価
		const scores = await Promise.all(population.map(code => evaluateCode(code)));
		console.log("Scores:", scores);

		// 選択
		const bestCodeIndex = scores.indexOf(Math.max(...scores));
		const bestCode = population[bestCodeIndex];

		// 次世代の生成
		const newPopulation = [bestCode]; 
		while (newPopulation.length < populationSize) {
			// ルーレット選択
			const totalScore = scores.reduce((sum, score) => sum + score, 0);
			let randomValue = Math.random() * totalScore;
			let selectedIndex = 0;
			while (randomValue > 0) {
				randomValue -= scores[selectedIndex];
				selectedIndex++;
			}
			selectedIndex--;
			const selectedCode = population[selectedIndex];
			// 突然変異または交叉
			const newIndividual = Math.random() < 0.5 
				? mutateCode(selectedCode) 
				: crossoverCode(selectedCode, population[Math.floor(Math.random() * population.length)]);
			newPopulation.push(newIndividual);
		}
		population = newPopulation;

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
 * - 評価関数に、エラー出力行数を減点に組み込むことで、より現実に即した評価指標を追加しました。
 * - コードの進化に遺伝的アルゴリズムを導入しました。選択、交叉、突然変異を実装し、より効率的にコードの探索ができるようになりました。
 * - populationSize, mutationRateを導入し、進化の調整を可能にしました。
 * 
 * Instruction
 * - 評価関数をさらに改良し、より複雑なコードの品質を評価できるようにしてください。
 * - 遺伝的アルゴリズムのパラメータを調整し、より効率的な進化を実現してください。
 * - コードの世代交代の方法を改善し、局所最適解に陥ることを防いでください。 
 */

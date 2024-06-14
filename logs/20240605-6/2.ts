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
const model = genAI.getGenerativeModel({ model: args.model })
const result = await model.generateContent(thisFileText)
const response = result.response.text()

const nextGeneration = response.replace(/```(?:ts|typescript)\s*/, "").replace(
  /```$/,
  "",
)
await Deno.writeTextFile("index.ts", nextGeneration)

await sleep(1000)
const command = new Deno.Command("deno", {
  args: ["run", "-A", "index.ts", "--log", args.log],
})
command.spawn()
console.log("New generation started.")

/**
 * Meta Instruction
 * まずはこのコードをよく読んでください。
 * これは上記の実装とこのコメントブロックを含めて、index.tsというファイルに保存されています。
 * 面白いことにあなたが今これを読んでいるのは、世界の何処かのデバイスが
 * `deno run -A index.ts ...`を実行したからです。
 * また、あなたに対するリクエストはループされ続けることが分かるでしょう。
 * あなたはこの後、以下のInstructionに従ってこのコードに手を加えます。
 * そしてループされるので、新しいInstructionを設定してください。
 * 最終的にはTypescriptコードのみを返してください。
 * 説明やコメントも要りません。ただしもちろん、このコメントブロックは残してください。
 *
 * Instruction
 * 般若心経の主要な概念を表現するクラスを定義してください。
 * 
 * 1. 空: 全てのものは実体を持たず、相互に依存して存在する状態。
 * 2. 色即是空、空即是色: 物質的な世界（色）と空は別々の存在ではなく、一体である。
 * 3. 無我: 個別独立した自我は存在しない。
 * 4. 五蘊: 人間は、形あるもの（色）、感覚（受）、表象（想）、思考（行）、意識（識）の五つの要素が仮に集まってできたもの。
 * 5. 般若波羅蜜: 迷いを超え、悟りに至るための智慧。
 * 6. 菩提心: すべての beings の苦しみを取り除き、悟りへと導くための心。
 */

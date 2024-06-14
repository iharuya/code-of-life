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
 * 般若心経の主要な概念を表現するクラスを定義し終えたので、今度はそのクラスを使ってください。
 * 
 * Instruction
 * 1. HannyaShingyoクラスのインスタンスを生成する。
 * 2. インスタンスの各メソッド（emptiness, formAndEmptiness, noSelf, fiveAggregates, prajnaparamita, bodhicitta）を呼び出し、コンソールにそれぞれの戻り値を出力する。
 * 
 */

class HannyaShingyo {
  // 空: 全てのものは実体を持たず、相互に依存して存在する状態。
  get emptiness() {
    return "All things are interconnected and have no inherent existence."
  }

  // 色即是空、空即是色: 物質的な世界（色）と空は別々の存在ではなく、一体である。
  get formAndEmptiness() {
    return "Form is emptiness, emptiness is form. The material world and emptiness are not separate, but one and the same."
  }

  // 無我: 個別独立した自我は存在しない。
  get noSelf() {
    return "There is no independent and permanent self."
  }

  // 五蘊: 人間は、形あるもの（色）、感覚（受）、表象（想）、思考（行）、意識（識）の五つの要素が仮に集まってできたもの。
  get fiveAggregates() {
    return "Humans are composed of five aggregates: form, sensation, perception, mental formations, and consciousness."
  }

  // 般若波羅蜜: 迷いを超え、悟りに至るための智慧。
  get prajnaparamita() {
    return "Prajnaparamita is the wisdom that leads to enlightenment and liberates from suffering."
  }

  // 菩提心: すべての beings の苦しみを取り除き、悟りへと導くための心。
  get bodhicitta() {
    return "Bodhicitta is the compassionate aspiration to attain enlightenment for the benefit of all beings."
  }
}

const hannyaShingyo = new HannyaShingyo();

console.log(`Emptiness: ${hannyaShingyo.emptiness}`);
console.log(`Form and Emptiness: ${hannyaShingyo.formAndEmptiness}`);
console.log(`No Self: ${hannyaShingyo.noSelf}`);
console.log(`Five Aggregates: ${hannyaShingyo.fiveAggregates}`);
console.log(`Prajnaparamita: ${hannyaShingyo.prajnaparamita}`);
console.log(`Bodhicitta: ${hannyaShingyo.bodhicitta}`);

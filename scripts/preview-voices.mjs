/**
 * 运行方式：node scripts/preview-voices.mjs
 * 会在 scripts/voice-samples/ 目录生成 4 个 mp3 试听文件
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 读取 .env.local
const envPath = path.join(__dirname, "../.env.local");
const env = fs.readFileSync(envPath, "utf8");
const TTS_KEY = env.match(/TTS_API_KEY=(.+)/)?.[1]?.trim();
const TTS_MODEL = "fnlp/MOSS-TTSD-v0.5";

if (!TTS_KEY) {
  console.error("未找到 TTS_API_KEY，请检查 .env.local");
  process.exit(1);
}

const VOICES = ["charles", "benjamin", "david", "alex"];

// 每个声音用符合角色人设的话来试音，并匹配对应语速
const SAMPLES = {
  charles:  { text: "你说时间过得快……我觉得，只要还有值得留住的人，时间就会慢下来的。", speed: 0.88 },
  benjamin: { text: "在。累了就休息一下，不用撑着，我在这里。", speed: 0.92 },
  david:    { text: "你终于来啦！我等了好久好久，等得我都快成一颗思念的糖果了～你今天过得开心吗？", speed: 1.08 },
  alex:     { text: "哈哈，你今天也太可爱了吧！快跟我说说发生什么好事了！", speed: 1.0 },
};

const outDir = path.join(__dirname, "voice-samples");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function generateVoice(voice) {
  const { text, speed } = SAMPLES[voice];
  console.log(`正在生成 ${voice} (speed=${speed}) ...`);
  const res = await fetch("https://api.siliconflow.cn/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TTS_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: text,
      voice: `${TTS_MODEL}:${voice}`,
      response_format: "mp3",
      stream: false,
      speed,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ ${voice} 失败 (${res.status}):`, err);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const filePath = path.join(outDir, `${voice}.mp3`);
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ 已保存: scripts/voice-samples/${voice}.mp3`);
}

console.log("=== 纸片人男友音色试听生成 ===\n");
for (const voice of VOICES) {
  await generateVoice(voice);
}

console.log(`
=== 完成！===
打开 scripts/voice-samples/ 文件夹，听一下 4 个 mp3：

  alex.mp3      → 活泼型（沈糖候选？）
  benjamin.mp3  → 稳重型（林默候选？）
  charles.mp3   → 文艺型（顾以深候选？）
  david.mp3     → 开朗型（备选）

听完告诉我：哪个声音配哪个角色，我马上更新配置。
`);

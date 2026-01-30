import { indexCodebase, searchCodebase } from "../../lib/rag.js";

/**
 * /rag 命令 - 知识库操作
 */
export async function handleRAG(input, activeConfig) {
  const parts = input.split(/\s+/);
  const sub = parts[1];

  if (sub === "index") {
    console.log("🚀 开始建立索引 (RAG)...");
    try {
      const count = await indexCodebase(process.cwd(), activeConfig);
      console.log(`✅ 索引建立完成! 共处理 ${count} 个代码块。`);
    } catch (e) {
      console.error("❌ 索引失败:", e.message);
    }
  } else if (sub === "search") {
    const query = parts.slice(2).join(" ");
    if (!query) {
      console.log("用法: /rag search <query>");
    } else {
      try {
        console.log(`🔍 正在搜索: ${query}`);
        const results = await searchCodebase(query, process.cwd(), activeConfig);
        if (results.length === 0) {
          console.log("⚠️  未找到匹配项");
        } else {
          results.forEach((r, i) => {
            console.log(`\n[${i+1}] ${r.file} (Score: ${r.score.toFixed(3)})`);
            console.log(r.content.slice(0, 200).replace(/\n/g, ' ') + "...");
          });
        }
      } catch (e) {
        console.error("❌ 搜索失败:", e.message);
      }
    }
  } else {
    console.log("用法:");
    console.log("  /rag index         建立/更新代码索引");
    console.log("  /rag search <q>    测试语义搜索");
  }
  return true;
}

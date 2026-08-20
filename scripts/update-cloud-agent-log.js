#!/usr/bin/env node
/**
 * Oppdaterer CLOUD-AGENT-LOG.md med nye git-commits siden forrige kjøring.
 * Kjøres av .github/workflows/cloud-agent-log.yml hver 10. time.
 */
const fs = require("fs");
const { execSync } = require("child_process");

const LOG_PATH = "CLOUD-AGENT-LOG.md";
const ENTRIES_BEGIN = "<!-- AUTO-LOG-ENTRIES-BEGIN -->";
const ENTRIES_END = "<!-- AUTO-LOG-ENTRIES-END -->";

function readLog() {
  if (!fs.existsSync(LOG_PATH)) {
    console.error("Mangler", LOG_PATH);
    process.exit(1);
  }
  return fs.readFileSync(LOG_PATH, "utf8");
}

function readLastSync(content) {
  const m = content.match(/AUTO-LOG-LAST-SYNC:\s*(\S+)\s*-->/);
  return m ? m[1] : null;
}

function setLastSync(content, iso) {
  if (content.includes("AUTO-LOG-LAST-SYNC:")) {
    return content.replace(/AUTO-LOG-LAST-SYNC:\s*\S+\s*-->/, `AUTO-LOG-LAST-SYNC: ${iso} -->`);
  }
  return content.replace(
    "**آخر تحديث آلي:**",
    `**آخر تحديث آلي:** <!-- AUTO-LOG-LAST-SYNC: ${iso} -->`
  );
}

function getCommitsSince(isoSince) {
  const since = isoSince || "2026-08-01T00:00:00Z";
  try {
    const out = execSync(
      `git log --since="${since}" --pretty=format:%h%x1f%ad%x1f%s --date=iso-strict -n 50`,
      { encoding: "utf8" }
    );
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, date, message] = line.split("\x1f");
        return { hash, date, message };
      });
  } catch {
    return [];
  }
}

function formatEntry(c) {
  return `- \`${c.date}\` · \`${c.hash}\` · ${c.message.replace(/\|/g, "\\|")}`;
}

function mergeEntries(existingBlock, newLines) {
  const existing = new Set(
    existingBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("- "))
  );
  const merged = [];
  for (const line of newLines) {
    if (!existing.has(line)) merged.push(line);
  }
  const kept = existingBlock.trim() ? existingBlock.trim().split("\n") : [];
  return [...merged, ...kept].slice(0, 120).join("\n");
}

function main() {
  let content = readLog();
  const lastSync = readLastSync(content);
  const now = new Date().toISOString();
  const commits = getCommitsSince(lastSync);

  if (commits.length === 0) {
    content = setLastSync(content, now);
    fs.writeFileSync(LOG_PATH, content);
    console.log("Ingen nye commits siden", lastSync || "—", "— oppdaterte kun tidsstempel.");
    return;
  }

  const newLines = commits.map(formatEntry);
  const beginIdx = content.indexOf(ENTRIES_BEGIN);
  const endIdx = content.indexOf(ENTRIES_END);
  if (beginIdx === -1 || endIdx === -1) {
    console.error("Mangler AUTO-LOG-ENTRIES-markører i", LOG_PATH);
    process.exit(1);
  }

  const before = content.slice(0, beginIdx + ENTRIES_BEGIN.length);
  const existingBlock = content.slice(beginIdx + ENTRIES_BEGIN.length, endIdx).trim();
  const after = content.slice(endIdx);
  const updatedBlock = mergeEntries(existingBlock, newLines);

  content = `${before}\n${updatedBlock}\n${after}`;
  content = setLastSync(content, now);
  fs.writeFileSync(LOG_PATH, content);
  console.log(`La til ${newLines.length} commit-linje(r). Synk: ${now}`);
}

main();

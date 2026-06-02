const pool = require("../config/db");

const REPLACEMENTS = [
  { from: "https://citycaffe.me", to: null },
  { from: "http://citycaffe.me", to: null },
  { from: "citycaffe.me", to: null },
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes("--apply"),
  };
}

async function main() {
  const { apply } = parseArgs();

  const candidates = REPLACEMENTS.map((item) => item.from);
  const res = await pool.query(
    `
    SELECT id, naziv, website
    FROM partner
    WHERE website = ANY($1::text[])
    ORDER BY naziv ASC
    `,
    [candidates]
  );

  if (res.rows.length === 0) {
    console.log("No matching partner.website values found.");
    return;
  }

  console.log(`Found ${res.rows.length} partner(s) to update:`);
  for (const row of res.rows) {
    const replacement = REPLACEMENTS.find((r) => r.from === row.website);
    console.log(
      `- ${row.naziv} (id=${row.id}): ${row.website} -> ${
        replacement?.to ?? "NULL"
      }`
    );
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to execute updates.");
    return;
  }

  await pool.query("BEGIN");
  try {
    for (const { from, to } of REPLACEMENTS) {
      await pool.query(
        `UPDATE partner SET website = $1 WHERE website = $2`,
        [to, from]
      );
    }

    await pool.query("COMMIT");
    console.log("Updates applied.");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Failed to update partner websites:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());


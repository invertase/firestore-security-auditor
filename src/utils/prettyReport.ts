import chalk from "chalk";
import { AuditResult } from "../genkit/flows/audit";

export function prettyReport(result: AuditResult): void {
  console.log(chalk.bold("\n=== Firestore Security Rules Audit ===\n"));

  // ─── Security Rating ─────────────────────────────────────────────────────────
  const totalBars = 30;
  const filled = Math.round((result.overallRating / 10) * totalBars);
  const bar =
    chalk.green("█".repeat(filled)) +
    chalk.gray("░".repeat(totalBars - filled));
  console.log(
    `Security Rating: ${chalk.bold(result.overallRating + "/10")}   ${bar}\n`
  );

  // ─── Vulnerabilities ────────────────────────────────────────────────────────
  if (result.vulnerabilities.length > 0) {
    console.log(
      chalk.red.bold(
        `✖ ${result.vulnerabilities.length} Vulnerabilit${
          result.vulnerabilities.length > 1 ? "ies" : "y"
        }\n`
      )
    );
    result.vulnerabilities.forEach((v) => {
      const sev = v.severity.toLowerCase();
      const sevLabel =
        sev === "critical"
          ? chalk.bgRed.white(" CRITICAL ")
          : sev === "high"
          ? chalk.red(" HIGH ")
          : sev === "medium"
          ? chalk.yellow(" MEDIUM ")
          : chalk.blue(" LOW ");
      console.log(
        `${sevLabel}  ${chalk.bold(v.description)}\n` +
          `  Recommendation: ${v.recommendation}\n` +
          (v.location ? `  Location: ${chalk.italic(v.location)}\n` : "")
      );
    });
  } else {
    console.log(chalk.green("✔ No vulnerabilities found!\n"));
  }

  // ─── Best Practices ─────────────────────────────────────────────────────────
  if (result.bestPractices.length > 0) {
    console.log(chalk.bold("Best Practices:\n"));
    result.bestPractices.forEach((bp, i) => console.log(`  ${i + 1}. ${bp}`));
    console.log("");
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(chalk.bold("Summary:\n"));
  console.log(result.summary + "\n");
}

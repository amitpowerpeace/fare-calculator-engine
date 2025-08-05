import { readFileSync } from "fs";
import { FareCapper } from "./services";
import { Journey, CommuterSummary, WeeklySummary } from "./models";

async function main() {
  const filePath = process.argv[2] || "./data/journeys.json";

  try {
    const rawData = readFileSync(filePath, "utf8");
    const journeys: Journey[] = JSON.parse(rawData);

    const fareCapper = new FareCapper();
    const { dailySummaries, weeklySummaries } =
      fareCapper.processJourneys(journeys);

    console.log("=".repeat(40));
    console.log("           DAILY SUMMARIES");
    console.log("=".repeat(40));

    Array.from(dailySummaries.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((summary: CommuterSummary) => {
        console.log(`\n📅 Date: ${summary.date}`);
        console.log("----------------------------------------");
        console.log(
          `  🚏 Farthest Zone for Day   : ${summary.farthestZoneDaily || "N/A"}`
        );
        console.log(
          `  💰 Applicable Daily Cap    : ${summary.effectiveDailyCap.toFixed(
            2
          )}`
        );
        console.log(
          `  🧾 Total Charged (Capped)  : ${summary.totalChargedDaily.toFixed(
            2
          )}`
        );
        console.log("  🚌 Individual Journeys:");

        if (summary.dailyJourneys.length === 0) {
          console.log("    (No journeys recorded for this day)");
        } else {
          summary.dailyJourneys.forEach((j) => {
            console.log(`    - ID: ${j.id}`);
            console.log(`      Zones     : ${j.fromZone} ➔ ${j.toZone}`);
            console.log(`      Time      : ${j.timestamp.split("T")[1]}`);
            console.log(`      Peak Hours: ${j.isPeakHours ? "Yes" : "No"}`);
            console.log(`      Initial Fare : ${j.initialFare.toFixed(2)}`);
            console.log(`      Charged Fare : ${j.chargedFare.toFixed(2)}\n`);
          });
        }
      });

    console.log("\n" + "=".repeat(40));
    console.log("           WEEKLY SUMMARIES");
    console.log("=".repeat(40));

    Array.from(weeklySummaries.values())
      .sort((a, b) => a.weekIdentifier.localeCompare(b.weekIdentifier))
      .forEach((summary: WeeklySummary) => {
        console.log(`\n📅 Week: ${summary.weekIdentifier}`);
        console.log("----------------------------------------");
        console.log(
          `  🚏 Farthest Zone for Week  : ${
            summary.farthestZoneWeekly || "N/A"
          }`
        );
        console.log(
          `  💰 Applicable Weekly Cap   : ${summary.effectiveWeeklyCap.toFixed(
            2
          )}`
        );
        console.log(
          `  🧾 Total Charged (Capped)  : ${summary.totalChargedWeekly.toFixed(
            2
          )}`
        );
      });

    console.log("\n" + "=".repeat(40));
    console.log("              END REPORT");
    console.log("=".repeat(40));
  } catch (error: any) {
    console.error("Error processing journeys:", error.message);
    process.exit(1);
  }
}

main();

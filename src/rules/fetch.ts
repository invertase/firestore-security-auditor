import { execSync } from "child_process";
import { GoogleAuth } from "google-auth-library";
import { logger } from "../utils/logger";
import { NotFoundError, InternalError } from "../utils/errors";

/**
 * Fetches Firestore security rules from a Firebase project
 * @param projectId The Firebase project ID
 * @returns The Firestore security rules as a string
 */
export async function fetchRulesFromProject(
  projectId: string
): Promise<string> {
  logger.info(
    `Attempting to fetch Firestore security rules for project: ${projectId}`
  );

  // Try fetching rules with Firebase CLI first
  try {
    const cliRules = tryFetchRulesWithCLI(projectId);
    if (cliRules) {
      logger.success("Successfully fetched rules via Firebase CLI");
      return cliRules;
    }
  } catch (error) {
    logger.debug("Failed to fetch rules with Firebase CLI", error);
    // Continue to next method
  }

  // Try fetching rules with the Firebase Rules API
  try {
    const apiRules = await tryFetchRulesWithAPI(projectId);
    if (apiRules) {
      logger.success("Successfully fetched rules via Firebase Rules API");
      return apiRules;
    }
  } catch (error) {
    logger.debug("Failed to fetch rules with Firebase Rules API", error);
    // Continue to final fallback
  }

  // If we got here, we couldn't fetch the rules
  logger.error(
    `Could not fetch Firestore security rules for project: ${projectId}`
  );
  throw new NotFoundError("Firestore security rules", projectId);
}

/**
 * Attempts to fetch Firestore security rules using the Firebase CLI
 * @param projectId The Firebase project ID
 * @returns The rules as a string, or null if the CLI approach failed
 */
function tryFetchRulesWithCLI(projectId: string): string | null {
  logger.debug(
    `Trying to fetch rules via Firebase CLI for project: ${projectId}`
  );

  try {
    const output = execSync(`firebase firestore:rules --project=${projectId}`, {
      encoding: "utf8",
    });

    if (output.includes("service cloud.firestore")) {
      return output;
    }

    logger.debug("Firebase CLI output did not contain valid Firestore rules");
    return null;
  } catch (error) {
    logger.debug("Firebase CLI not available or not authenticated", error);
    return null;
  }
}

/**
 * Type for the response from the Firebase Rules API
 */
interface RulesetListResponse {
  rulesets: Array<{ name: string }>;
}

/**
 * Type for the ruleset content response
 */
interface RulesetContentResponse {
  source: {
    files: Array<{ content: string }>;
  };
}

/**
 * Attempts to fetch Firestore security rules using the Firebase Rules API
 * @param projectId The Firebase project ID
 * @returns The rules as a string, or null if the API approach failed
 */
async function tryFetchRulesWithAPI(projectId: string): Promise<string | null> {
  logger.debug(
    `Trying to fetch rules via Firebase Rules API for project: ${projectId}`
  );

  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/firebase"],
    });

    const client = await auth.getClient();

    // List all rulesets
    const listUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
    const listResp = await client.request({ url: listUrl });

    const rulesets = listResp.data as RulesetListResponse;

    if (!rulesets.rulesets || rulesets.rulesets.length === 0) {
      logger.debug("No rulesets found for this project");
      return null;
    }

    // Get the content of the latest ruleset
    const latest = rulesets.rulesets[0];
    const contentUrl = `https://firebaserules.googleapis.com/v1/${latest.name}`;
    const contentResp = await client.request({ url: contentUrl });

    const rulesetContent = contentResp.data as RulesetContentResponse;

    if (
      !rulesetContent.source?.files ||
      rulesetContent.source.files.length === 0
    ) {
      logger.debug("Ruleset contains no files");
      return null;
    }

    // Find the Firestore rules file (it contains "service cloud.firestore")
    const file = rulesetContent.source.files.find((f) =>
      f.content?.includes("service cloud.firestore")
    );

    if (!file || !file.content) {
      logger.debug("No Firestore rules found in ruleset");
      return null;
    }

    return file.content;
  } catch (error) {
    logger.debug("Error accessing Firebase Rules API", error);

    if (error instanceof Error) {
      throw new InternalError(
        `Failed to access Firebase Rules API: ${error.message}`
      );
    }

    throw new InternalError(
      "Failed to access Firebase Rules API: Unknown error"
    );
  }
}

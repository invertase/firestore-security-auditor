import { z } from "genkit";
import { gemini20Flash } from "@genkit-ai/googleai";
import { ai } from "../client";
import logger from "../../utils/logger";

// Define schemas for input and output
const InputSchema = z.object({
  rules: z.string(),
  projectId: z.string().optional(),
});

export type Input = z.infer<typeof InputSchema>;

const AuditResultSchema = z.object({
  summary: z.string(),
  vulnerabilities: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
      recommendation: z.string(),
      location: z.string().optional(),
    })
  ),
  bestPractices: z.array(z.string()),
  overallRating: z.number().min(1).max(10),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

/**
 * Flow that analyzes Firestore security rules and provides recommendations
 */
export const auditFlow = ai.defineFlow(
  {
    name: "firestoreRulesAudit",
    inputSchema: InputSchema,
    outputSchema: AuditResultSchema,
  },
  async ({ rules, projectId }) => {
    logger.info("Starting security rules audit");

    const prompt = `
You are a Firebase security expert conducting an audit of Firestore security rules.

Please analyze the following Firestore security rules carefully and provide a comprehensive security assessment.

Focus on:
1. Identifying any security vulnerabilities or overly permissive rules
2. Checking for proper authentication requirements
3. Evaluating data validation rules
4. Assessing field-level security
5. Identifying any potential performance issues
6. Suggesting best practices improvements

${projectId ? `\nProject ID: ${projectId}` : ""}

Firestore Rules:
\`\`\`
${rules}
\`\`\`

Respond with a structured analysis that includes:
- A summary of the overall security posture
- A list of vulnerabilities found (with severity rating)
- Specific recommendations for each vulnerability
- Best practices that should be implemented
- An overall security rating from 1-10
`;

    logger.debug("Sending rules to AI for analysis");

    try {
      const { output } = await ai.generate({
        model: gemini20Flash,
        prompt,
        output: { schema: AuditResultSchema },
      });

      if (!output) {
        throw new Error("Failed to generate a valid audit result");
      }

      logger.info(
        `Audit completed with overall rating: ${output.overallRating}/10`
      );
      logger.debug(`Found ${output.vulnerabilities.length} vulnerabilities`);

      return output;
    } catch (error) {
      logger.error("Error during rules audit", error);
      throw new Error(
        `Failed to audit rules: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

/**
 * Simplified flow that returns a text-based analysis rather than structured data
 */
export const simplifiedAuditFlow = ai.defineFlow(
  {
    name: "firestoreRulesSimpleAudit",
    inputSchema: InputSchema,
    outputSchema: z.string(),
  },
  async ({ rules, projectId }) => {
    logger.info("Starting simplified security rules audit");

    const prompt = `
You are a Firebase security expert conducting an audit of Firestore security rules.

Please analyze the following Firestore security rules carefully and provide a comprehensive security assessment.

Focus on:
1. Identifying any security vulnerabilities or overly permissive rules
2. Checking for proper authentication requirements
3. Evaluating data validation rules
4. Assessing field-level security
5. Identifying any potential performance issues
6. Suggesting best practices improvements

${projectId ? `\nProject ID: ${projectId}` : ""}

Firestore Rules:
\`\`\`
${rules}
\`\`\`

Provide your analysis in a clear, readable format with sections for:
- Summary
- Vulnerabilities
- Recommendations
- Best Practices
`;

    logger.debug("Sending rules to AI for simplified analysis");

    try {
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
      });

      logger.info("Simplified audit completed successfully");
      return text;
    } catch (error) {
      logger.error("Error during simplified rules audit", error);
      throw new Error(
        `Failed to audit rules: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

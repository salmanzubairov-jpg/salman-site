import { readFileSync } from 'node:fs';
const review = JSON.parse(readFileSync(new URL('../release-review.json', import.meta.url)));
const required = ['operatorDetailsVerified','privacyPolicyReviewed','hostingAndLogsReviewed','incidentAndTokenRevokeHandled','ownerApprovedProduction'];
const pending = required.filter((key) => review[key] !== true);
if (pending.length) {
  console.error('Production publication blocked. Unresolved reviews: ' + pending.join(', '));
  process.exit(1);
}

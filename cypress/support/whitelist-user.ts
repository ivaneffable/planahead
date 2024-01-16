// Use this to whitelist a user by their email
// Simply call this with:
// npx ts-node -r tsconfig-paths/register ./cypress/support/whitelist-user.ts username@example.com,

import { installGlobals } from "@remix-run/node";

import { prisma } from "~/db.server";

installGlobals();

async function whitelist(email: string) {
  if (!email) {
    throw new Error("email required to be whitelisted");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  await prisma.userWhiteList.create({ data: { email } });
}

whitelist(process.argv[2]);

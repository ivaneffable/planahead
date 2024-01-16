// Use this to remove a user from the whitelist by their email
// Simply call this with:
// npx ts-node -r tsconfig-paths/register ./cypress/support/delete-whitelist-user username@example.com,
// and that user will get deleted

import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { installGlobals } from "@remix-run/node";

import { prisma } from "~/db.server";

installGlobals();

async function deleteUserFromWhitelist(email: string) {
  if (!email) {
    throw new Error("email required to be whitelisted");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  try {
    await prisma.userWhiteList.delete({ where: { email } });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      console.log("User not found, so no need to delete");
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

deleteUserFromWhitelist(process.argv[2]);

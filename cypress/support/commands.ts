import { faker } from "@faker-js/faker";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in with a random user. Yields the user and adds an alias to the user
       *
       * @returns {typeof login}
       * @memberof Chainable
       * @example
       *    cy.login()
       * @example
       *    cy.login({ email: 'whatever@example.com' })
       */
      login: typeof login;

      /**
       * Deletes the current @user
       *
       * @returns {typeof cleanupUser}
       * @memberof Chainable
       * @example
       *    cy.cleanupUser()
       * @example
       *    cy.cleanupUser({ email: 'whatever@example.com' })
       */
      cleanupUser: typeof cleanupUser;

      /**
       * Whitelist the provided @user
       *
       * @returns {typeof whitelistTestUser}
       * @memberof Chainable
       * @example
       *    cy.whitelistUser({ email: 'whatever@example.com' })
       */
      whitelistUser: typeof whitelistTestUser;

      /**
       * Clean the whitelisted @user
       *
       * @returns {typeof cleanWhitelistedUser}
       * @memberof Chainable
       * @example
       *    cy.cleanWhitelistedUser({ email: 'whatever@example.com' })
       */
      cleanWhitelistedUser: typeof cleanWhitelistedUser;

      /**
       * Extends the standard visit command to wait for the page to load
       *
       * @returns {typeof visitAndCheck}
       * @memberof Chainable
       * @example
       *    cy.visitAndCheck('/')
       *  @example
       *    cy.visitAndCheck('/', 500)
       */
      visitAndCheck: typeof visitAndCheck;
    }
  }
}

function login({
  email = faker.internet.email(undefined, undefined, "example.com"),
}: {
  email?: string;
} = {}) {
  cy.then(() => ({ email })).as("user");
  cy.exec(
    `npx ts-node -r tsconfig-paths/register ./cypress/support/create-user.ts "${email}"`,
  ).then(({ stdout }) => {
    const cookieValue = stdout
      .replace(/.*<cookie>(?<cookieValue>.*)<\/cookie>.*/s, "$<cookieValue>")
      .trim();
    cy.setCookie("__session", cookieValue);
  });
  return cy.get("@user");
}

function whitelistTestUser({ email }: { email: string }) {
  cy.exec(
    `npx ts-node -r tsconfig-paths/register ./cypress/support/whitelist-user.ts "${email}"`,
  );
}

function cleanWhitelistedUser({ email }: { email: string }) {
  cy.exec(
    `npx ts-node -r tsconfig-paths/register ./cypress/support/delete-whitelist.ts "${email}"`,
  );
}

function cleanupUser({ email }: { email?: string } = {}) {
  if (email) {
    deleteUserByEmail(email);
  } else {
    cy.get("@user").then((user) => {
      const email = (user as { email?: string }).email;
      if (email) {
        deleteUserByEmail(email);
      }
    });
  }
  cy.clearCookie("__session");
}

function deleteUserByEmail(email: string) {
  cy.exec(
    `npx ts-node -r tsconfig-paths/register ./cypress/support/delete-user.ts "${email}"`,
  );
  cy.clearCookie("__session");
}

// We're waiting a second because of this issue happen randomly
// https://github.com/cypress-io/cypress/issues/7306
// Also added custom types to avoid getting detached
// https://github.com/cypress-io/cypress/issues/7306#issuecomment-1152752612
// ===========================================================
function visitAndCheck(url: string, waitTime = 1000) {
  cy.visit(url);
  cy.location("pathname").should("contain", url).wait(waitTime);
}

export const registerCommands = () => {
  Cypress.Commands.add("login", login);
  Cypress.Commands.add("cleanupUser", cleanupUser);
  Cypress.Commands.add("whitelistUser", whitelistTestUser);
  Cypress.Commands.add("cleanWhitelistedUser", cleanWhitelistedUser);
  Cypress.Commands.add("visitAndCheck", visitAndCheck);
};

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, json } from "@remix-run/react";

import { buttonVariants } from "~/components/ui/button";
import { requireAnonymous } from "~/session.server";

export const meta: MetaFunction = () => [{ title: "PlanAhead" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAnonymous(request);

  return json({});
};

export default function Index() {
  return (
    <main className="flex justify-end gap-4 pt-6 px-4">
      <Link to="/join" className={buttonVariants({ variant: "default" })}>
        Sign up
      </Link>
      <Link to="/login" className={buttonVariants({ variant: "secondary" })}>
        Log In
      </Link>
    </main>
  );
}

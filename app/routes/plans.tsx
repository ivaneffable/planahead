import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet } from "@remix-run/react";

import { Button } from "~/components/ui/button";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({});
};

export default function PlansPage() {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">PlanAhead</Link>
        </h1>

        <Form action="/logout" method="post">
          <Button type="submit">Logout</Button>
        </Form>
      </header>

      <main className="flex h-full p-2">
        <Outlet />
      </main>
    </div>
  );
}

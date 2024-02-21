import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useOutletContext } from "@remix-run/react";
import { useGeolocation } from "@uidotdev/usehooks";

import { Button } from "~/components/ui/button";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({});
};

export default function PlansPage() {
  const { latitude, longitude } = useGeolocation();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">PlanAhead</Link>
        </h1>

        <Form action="/logout" method="post">
          <Button type="submit">Logout</Button>
        </Form>
      </header>

      <nav className="flex items-center justify-between bg-slate-700 p-2">
        <Link to="new-plan">New Plan</Link>
      </nav>

      <main className="flex h-full p-2">
        <Outlet
          context={
            {
              deviceLatitude: latitude,
              deviceLongitude: longitude,
            } satisfies ContextType
          }
        />
      </main>
    </div>
  );
}

interface ContextType {
  deviceLatitude: number | null;
  deviceLongitude: number | null;
}

export function useDeviceGeolocation() {
  return useOutletContext<ContextType>();
}

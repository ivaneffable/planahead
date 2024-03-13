import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Card } from "~/components/ui/card";
import { getPlans } from "~/models/plans.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const plans = await getPlans(userId);

  return json({ plans });
};

export default function PlanList() {
  const { plans } = useLoaderData<typeof loader>();

  let lastMonth: string;
  return (
    <div className="w-full">
      {plans
        .filter((plan): plan is { date: string } & typeof plan => !!plan.date)
        .map((plan, index) => {
          const date = new Intl.DateTimeFormat("en", {
            month: "long",
            weekday: "short",
            day: "numeric",
          }).format(new Date(plan.date));
          const [weekday, monthAndDay] = date.split(", ");
          const [month, day] = monthAndDay.split(" ");

          let printMonth = false;
          if (lastMonth !== month) {
            lastMonth = month;
            printMonth = true;
          }

          let margin = "mt-0";
          if (index !== 0) {
            margin = printMonth ? "mt-3" : "mt-1";
          }

          return (
            <div key={plan.id} className={margin}>
              <div className="text-2xl font-bold">
                {printMonth ? lastMonth : null}
              </div>

              <Card>
                <div className="flex">
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold p-2">{day}</div>
                    <div className="bg-orange-400 text-center rounded-bl-lg p-2">
                      {weekday}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-2xl">{plan.place.name}</div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
    </div>
  );
}

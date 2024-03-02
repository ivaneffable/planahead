import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Tag, X } from "lucide-react";
import { useState, SyntheticEvent } from "react";
import invariant from "tiny-invariant";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { getPlan, updatePlan } from "~/models/plans.server";
import { requireUserId } from "~/session.server";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.planId, "planId not found");
  await requireUserId(request);
  const formData = await request.formData();

  const date = formData.get("date")?.toString();
  const tags = formData.get("tags")?.toString() || "";

  invariant(date, "date not found");

  await updatePlan(params.planId, {
    date: new Date(date),
    tags: tags === "" ? [] : tags.split("|"),
  });

  return redirect("/plans");
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.planId, "planId not found");

  const plan = await getPlan({ id: params.planId, userId });
  if (!plan) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ plan });
};

export default function NewPlanPlace() {
  const { plan } = useLoaderData<typeof loader>();
  const [date, setDate] = useState<Date | undefined>(
    plan.date ? new Date(plan.date) : new Date(),
  );
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="flex flex-col justify-between items-center w-full">
      <div className="flex flex-col items-center w-full">
        <Card className="mb-2">
          <CardContent className="p-3 flex flex-col justify-center">
            <div className="text-xl">{plan.place?.name}</div>
            <div className="text-sm text-slate-500">{plan.place?.address}</div>
          </CardContent>
        </Card>
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          onSelect={setDate}
          fromDate={new Date()}
          className="rounded-md border mb-2"
        />
      </div>

      <div className="flex flex-col w-full">
        <form
          onSubmit={(event: SyntheticEvent) => {
            event.preventDefault();
            const target = event.target as HTMLFormElement;
            const tagName = target.tag.value;

            if (tagName && !tags.includes(tagName)) {
              setTags([...tags, tagName]);
            }
            target.reset();
          }}
          className="flex w-full space-x-3"
        >
          <div className="relative grow mb-2">
            <Tag className="absolute left-2 m-auto top-0 bottom-0 h-4 w-4" />
            <Input
              name="tag"
              placeholder="add tags to your plan"
              className="pl-8 text-lg"
              autoComplete="off"
              type="text"
            />
          </div>
          <Button className="px-4 w-1/6 text-lg" variant="secondary">
            Add
          </Button>
          <input type="submit" hidden />
        </form>
        {tags.length > 0 ? (
          <div>
            {tags.map((tag) => (
              <Badge className="text-lg mr-1 hover:bg-slate-900" key={tag}>
                <div className="flex items-center">
                  {tag}
                  <X
                    className="h-4 w-4 m-1 cursor-pointer"
                    onClick={() => {
                      setTags(tags.filter((t) => t !== tag));
                    }}
                  />
                </div>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-lg">No tags...</div>
        )}
        <Form method="post" className="w-full mt-2">
          <input type="hidden" name="date" value={date?.toISOString()} />
          <input type="hidden" name="tags" value={tags.join("|")} />
          <div className="flex justify-around">
            <Button className="px-4 py-2 m-1 w-1/2 text-lg">Create</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

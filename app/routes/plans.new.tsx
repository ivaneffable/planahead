import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useGeolocation } from "@uidotdev/usehooks";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { ClientOnly } from "remix-utils/client-only";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { searchText } from "~/lib/google/places";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const placeQuery = formData.get("placeQuery")?.toString();
  const referer = request.headers.get("referer");

  if (!placeQuery || !referer) {
    return json({ status: 400 });
  }

  searchText(placeQuery, referer);

  return json({ status: 200 });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({
    ENV: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    },
  });
};

export default function NewPlanPage() {
  const state = useGeolocation();
  console.log(state);
  const data = useLoaderData<typeof loader>();
  return (
    <Form method="post" className="flex flex-col w-full">
      <div className="pb-2">
        <Label htmlFor="email">Where?</Label>
        <Input
          id="email"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={true}
          autoComplete="off"
          name="placeQuery"
          type="text"
        />
      </div>

      <APIProvider apiKey={data.ENV.GOOGLE_MAPS_API_KEY!}>
        <ClientOnly>
          {() => (
            <Map
              className="rounded-lg flex-1"
              zoom={3}
              center={{ lat: 22.54992, lng: 0 }}
              gestureHandling={"greedy"}
              disableDefaultUI={true}
            />
          )}
        </ClientOnly>
      </APIProvider>
    </Form>
  );
}

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";

import { searchText } from "~/lib/google/places";
import { createPlan } from "~/models/plans.server";
import { requireUserId } from "~/session.server";

import PlaceSelection from "./PlaceSelection.client";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get("_action")?.toString();

  if (action === "add-place") {
    const placeId = formData.get("placeId")?.toString();
    const name = formData.get("name")?.toString();
    const address = formData.get("address")?.toString();
    const latitude = formData.get("latitude")?.toString();
    const longitude = formData.get("longitude")?.toString();

    if (!placeId || !name || !address || !latitude || !longitude) {
      return json({ status: 400, places: [] });
    }
    const { id } = await createPlan(userId, {
      placeId,
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });

    return redirect(`/plans/${id}`);
  }

  const placeQuery = formData.get("placeQuery")?.toString();
  const latitude = formData.get("latitude")?.toString();
  const longitude = formData.get("longitude")?.toString();

  const referer = request.headers.get("referer");

  if (!placeQuery || !referer) {
    return json({ status: 400, places: [] });
  }

  const locationBias =
    latitude && longitude ? { latitude, longitude } : undefined;
  const places = await searchText(placeQuery, referer, locationBias);
  return json({ status: 200, places });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({
    env: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    },
  });
};

export default function NewPlanPlace() {
  const actionData = useActionData<typeof action>();

  const places = actionData?.places || [];

  if (typeof document === "undefined") {
    return null;
  }

  return <PlaceSelection places={places} />;
}

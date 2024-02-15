import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useGeolocation } from "@uidotdev/usehooks";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { searchText } from "~/lib/google/places";
import { createPlan } from "~/models/plans.server";
import { requireUserId } from "~/session.server";

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
    const { id } = await createPlan(
      {
        placeId,
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      userId,
    );

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
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace>();
  const map = useMap();
  const { latitude, longitude } = useGeolocation();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);

  const places = actionData?.places || [];

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (places[0]?.id) {
      setSelectedPlace(places[0]);
      map?.panTo({
        lat: places[0].location.latitude,
        lng: places[0].location.longitude,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, places[0]?.id]);

  useEffect(() => {
    if (formRef.current) {
      const formElements = formRef.current.elements;
      const inputElement = formElements[
        "where" as keyof typeof formElements
      ] as HTMLInputElement;
      inputElement.focus();
    }
  }, []);

  useEffect(() => {
    if (isSubmitting && formRef.current) {
      formRef.current.reset();
      const formElements = formRef.current.elements;
      const inputElement = formElements[
        "where" as keyof typeof formElements
      ] as HTMLInputElement;
      inputElement.blur();
    }
  }, [isSubmitting]);

  return (
    <div className="flex flex-col w-full">
      <Form ref={formRef} method="post" className="flex flex-col w-full h-full">
        <input type="hidden" name="latitude" value={latitude || undefined} />
        <input type="hidden" name="longitude" value={longitude || undefined} />
        <div className="mb-1 relative">
          <Search className="absolute left-2 m-auto top-0 bottom-0 h-4 w-4 " />
          <Input
            id="where"
            placeholder="where we going?"
            className="pl-8"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={true}
            autoComplete="off"
            name="placeQuery"
            type="text"
          />
        </div>

        {places?.map((place) => (
          <div key={place.id} className="pt-1">
            <Card
              className={`hover:border-slate-300 cursor-pointer ${
                place.id === selectedPlace?.id
                  ? "border-slate-300 bg-slate-100"
                  : undefined
              }`}
              onClick={() => {
                setSelectedPlace(place);
                map?.panTo({
                  lat: place.location.latitude,
                  lng: place.location.longitude,
                });
              }}
            >
              <CardContent className="p-3 flex flex-col justify-center">
                <div className="text-xl">{place.displayName.text}</div>
                <div className="text-sm text-slate-500">
                  {place.formattedAddress}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        <div className="flex flex-1 pt-2 pb-2">
          <ClientOnly>
            {() => (
              <Map
                className="rounded-lg flex-1"
                zoom={15}
                center={
                  latitude && longitude
                    ? { lat: latitude, lng: longitude }
                    : { lat: 0, lng: 0 }
                }
                gestureHandling={"greedy"}
                disableDefaultUI={true}
              >
                {selectedPlace ? (
                  <Marker
                    position={{
                      lat: selectedPlace.location.latitude,
                      lng: selectedPlace.location.longitude,
                    }}
                  />
                ) : null}
              </Map>
            )}
          </ClientOnly>
        </div>
      </Form>

      <Form method="post">
        <input type="hidden" name="placeId" value={selectedPlace?.id} />
        <input
          type="hidden"
          name="name"
          value={selectedPlace?.displayName?.text}
        />
        <input
          type="hidden"
          name="address"
          value={selectedPlace?.formattedAddress}
        />
        <input
          type="hidden"
          name="latitude"
          value={selectedPlace?.location.latitude}
        />
        <input
          type="hidden"
          name="longitude"
          value={selectedPlace?.location.longitude}
        />
        <Button
          disabled={!selectedPlace}
          className="px-4 py-2"
          name="_action"
          value="add-place"
        >
          Add Plan
        </Button>
      </Form>
    </div>
  );
}

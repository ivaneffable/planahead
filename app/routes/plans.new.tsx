import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useGeolocation } from "@uidotdev/usehooks";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";

import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { searchText } from "~/lib/google/places";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const placeQuery = formData.get("placeQuery")?.toString();
  const referer = request.headers.get("referer");

  if (!placeQuery || !referer) {
    return json({ status: 400, places: [] });
  }

  const places = await searchText(placeQuery, referer);
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

export default function NewPlanPage() {
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
    <Form ref={formRef} method="post" className="flex flex-col w-full">
      <div className="pb-1">
        <Label htmlFor="where">Where?</Label>
        <Input
          id="where"
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

      <div className="flex flex-1 pt-2">
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
  );
}

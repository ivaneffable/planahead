/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

interface GooglePlace {
  id: string;
  location: { latitude: number; longitude: number };
  displayName: { text: string };
  formattedAddress: string;
}

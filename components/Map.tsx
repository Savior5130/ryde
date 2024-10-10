import { ActivityIndicator, Platform, Text, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useDriverStore, useLocationStore } from "@/store";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useEffect, useState } from "react";
import { MarkerData } from "@/types/type";
import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import MapViewDirections from "react-native-maps-directions";

const Map = () => {
  const { selectedDriver, setDrivers } = useDriverStore();
  const { data: drivers, loading, error } = useFetch("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const {
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude,
  } = useLocationStore();

  const region = calculateRegion({
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  });

  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });
      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  useEffect(() => {
    if (markers.length > 0 && destinationLatitude && destinationLongitude) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [destinationLatitude, destinationLongitude, markers]);

  if (loading || !userLatitude || !userLongitude)
    return (
      <View className="flex justify-center items-center w-full">
        <ActivityIndicator size={"small"} color={"000"} />
      </View>
    );

  if (error)
    return (
      <View className="flex justify-center items-center w-full">
        <Text>Error: {error}</Text>
      </View>
    );

  return (
    <MapView
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      tintColor={"black"}
      mapType={"mutedStandard"}
      showsPointsOfInterest={false}
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle={"light"}
    >
      {markers.map((item) => (
        <Marker
          coordinate={{
            latitude: item.latitude,
            longitude: item.longitude,
          }}
          key={item.id}
          title={item.title}
          image={
            selectedDriver === item.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}

      {destinationLatitude && destinationLongitude && (
        <>
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            icon={icons.pin}
          />
          <MapViewDirections
            origin={{
              latitude: userLatitude!,
              longitude: userLongitude!,
            }}
            destination={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
            strokeColor={"#0286ff"}
            strokeWidth={2}
          />
        </>
      )}
    </MapView>
  );
};
export default Map;

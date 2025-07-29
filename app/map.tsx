    import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
  formatted_phone_number?: string;
}

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userLat = parseFloat(params.userLat as string);
  const userLng = parseFloat(params.userLng as string);
  const type = params.type as string;

  useEffect(() => {
    console.log('Map screen mounted with params:', params);
    if (params.places) {
      try {
        const parsedPlaces = JSON.parse(params.places as string);
        console.log('Parsed places count:', parsedPlaces.length);
        setPlaces(parsedPlaces);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing places:', error);
        Alert.alert('Error', 'Failed to load places data');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [params.places]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const openInMaps = (place: PlaceResult) => {
    const { lat, lng } = place.geometry.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPlace = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const showPlaceDetails = (place: PlaceResult) => {
    router.push({
      pathname: '/details',
      params: {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat.toString(),
        lng: place.geometry.location.lng.toString(),
      }
    });
  };

  const openFullMap = () => {
    const url = `https://www.google.com/maps/search/${type}/@${userLat},${userLng},15z`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading map data...
        </Text>
      </View>
    );
  }

  if (isNaN(userLat) || isNaN(userLng)) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Ionicons name="location-outline" size={64} color={isDark ? '#6B7280' : '#9CA3AF'} />
        <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Invalid location data
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-500 px-4 py-2 rounded-lg mt-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with location info and map controls */}
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Interactive Map View
        </Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}s near you
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Location: {userLat.toFixed(4)}, {userLng.toFixed(4)}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Found {places.length} places nearby
        </Text>
        
        <View className="flex-row justify-between mt-3">
          <TouchableOpacity
            onPress={openFullMap}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center flex-1 mr-2"
          >
            <Ionicons name="map" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Open Google Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Visualization - List View with Visual Map Elements */}
      <ScrollView className="flex-1 p-4">
        <View className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <View className="flex-row items-center mb-3">
            <View className="w-4 h-4 bg-red-500 rounded-full mr-2" />
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Location
            </Text>
          </View>
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Latitude: {userLat.toFixed(6)}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Longitude: {userLng.toFixed(6)}
          </Text>
        </View>

        {places.map((place, index) => {
          const distance = calculateDistance(
            userLat,
            userLng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          const getMarkerColor = (placeTypes: string[]) => {
            if (placeTypes.includes('hospital')) return 'bg-red-500';
            if (placeTypes.includes('pharmacy')) return 'bg-green-500';
            if (placeTypes.includes('police')) return 'bg-blue-500';
            if (placeTypes.includes('gas_station')) return 'bg-yellow-500';
            if (placeTypes.includes('bank') || placeTypes.includes('atm')) return 'bg-purple-500';
            return 'bg-gray-500';
          };

          return (
            <TouchableOpacity
              key={place.place_id}
              onPress={() => setSelectedPlace(selectedPlace?.place_id === place.place_id ? null : place)}
              className={`mb-3 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border-l-4 ${
                selectedPlace?.place_id === place.place_id ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <View className={`w-8 h-8 ${getMarkerColor(place.types)} rounded-full items-center justify-center mr-3`}>
                      <Text className="text-white font-bold text-sm">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {place.name}
                      </Text>
                      <Text className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {place.vicinity}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mt-2 ml-11">
                    <Ionicons name="location" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {distance.toFixed(1)} km away
                    </Text>
                    
                    {place.rating && (
                      <>
                        <Ionicons name="star" size={16} color="#FCD34D" style={{ marginLeft: 12 }} />
                        <Text className={`ml-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {place.rating.toFixed(1)}
                        </Text>
                      </>
                    )}
                    
                    {place.opening_hours && (
                      <Text className={`ml-3 text-sm ${
                        place.opening_hours.open_now 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {place.opening_hours.open_now ? 'Open' : 'Closed'}
                      </Text>
                    )}
                  </View>

                  {/* Coordinates Display */}
                  <View className="mt-2 ml-11">
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {place.geometry.location.lat.toFixed(4)}, {place.geometry.location.lng.toFixed(4)}
                    </Text>
                  </View>
                </View>
                
                <Ionicons 
                  name={selectedPlace?.place_id === place.place_id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
              </View>
              
              {/* Expanded Actions */}
              {selectedPlace?.place_id === place.place_id && (
                <View className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <View className="flex-row justify-around">
                    <TouchableOpacity
                      onPress={() => showPlaceDetails(place)}
                      className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="information-circle" size={16} color="white" />
                      <Text className="text-white font-medium ml-1">Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => openInMaps(place)}
                      className="bg-green-500 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="navigate" size={16} color="white" />
                      <Text className="text-white font-medium ml-1">Navigate</Text>
                    </TouchableOpacity>
                    
                    {place.formatted_phone_number && (
                      <TouchableOpacity
                        onPress={() => callPlace(place.formatted_phone_number!)}
                        className="bg-orange-500 px-3 py-2 rounded-lg flex-row items-center"
                      >
                        <Ionicons name="call" size={16} color="white" />
                        <Text className="text-white font-medium ml-1">Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {places.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons 
              name="location-outline" 
              size={64} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
            />
            <Text className={`text-lg font-medium mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              No places found
            </Text>
            <Text className={`text-center mt-2 px-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search criteria or location
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}